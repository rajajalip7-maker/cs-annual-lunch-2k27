import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/db';
import { checkRateLimit, runFraudChecks } from '@/lib/fraud';
import { getSlaDueAt } from '@/lib/sla';
import { savePaymentProof, validateFile } from '@/lib/upload';
import { registrationSchema, TICKET_AMOUNT } from '@/lib/validation';
import { getClientIp, requireStudent } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(request: NextRequest) {
  const session = await requireStudent();
  if (!session) {
    return NextResponse.json({ error: 'Please log in first' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const ip = getClientIp(request);

    const raw = {
      mobile: formData.get('mobile') as string,
      affiliation: formData.get('affiliation') as string,
      gender: formData.get('gender') as string,
      accommodationType: formData.get('accommodationType') as string,
      hostelName: (formData.get('hostelName') as string) || '',
      website: (formData.get('website') as string) || '',
    };

    if (raw.website) {
      return NextResponse.json({ error: 'Submission rejected' }, { status: 400 });
    }

    const parsed = registrationSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const existingPayment = await prisma.payment.findFirst({
      where: {
        userId: session.userId,
        status: { in: ['pending', 'approved', 'flagged'] },
      },
    });
    if (existingPayment) {
      return NextResponse.json(
        { error: 'You already have an active registration. Check your dashboard.' },
        { status: 409 }
      );
    }

    const rateKey = `reg:${session.userId}:${ip}`;
    const rateCheck = await checkRateLimit(rateKey);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again in an hour.' },
        { status: 429 }
      );
    }

    const file = formData.get('proof') as File | null;
    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'Payment proof is required' }, { status: 400 });
    }

    const fileValidation = validateFile(file);
    if (!fileValidation.valid) {
      return NextResponse.json({ error: fileValidation.error }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const transactionId = `TXN-${uuidv4().slice(0, 12).toUpperCase()}`;
    const { filePath, fileHash, fileName } = await savePaymentProof(file, user.id);

    const fraudFlags = await runFraudChecks({
      transactionId,
      fileHash,
      mobile: data.mobile,
      amount: TICKET_AMOUNT,
    });

    const status = fraudFlags.length > 0 ? 'flagged' : 'pending';

    const result = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.userId },
        data: {
          mobile: data.mobile,
          affiliation: data.affiliation,
          gender: data.gender,
          accommodationType: data.accommodationType,
          hostelName: data.accommodationType === 'hostellite' ? data.hostelName : null,
          profileComplete: true,
        },
      });

      const payment = await tx.payment.create({
        data: {
          userId: session.userId,
          transactionId,
          amount: TICKET_AMOUNT,
          status,
          filePath,
          fileHash,
          fileName,
          flaggedReason: fraudFlags.length > 0 ? fraudFlags.join('; ') : null,
          slaDueAt: getSlaDueAt(),
        },
      });

      return { payment };
    });

    await logAudit({
      action: 'registration_submitted',
      targetTable: 'payments',
      targetId: result.payment.id,
      metadata: { rollNo: user.rollNo, status: result.payment.status, gender: data.gender },
    });

    return NextResponse.json({
      success: true,
      trackingId: result.payment.id,
      status: result.payment.status,
      message:
        result.payment.status === 'flagged'
          ? 'Submitted for additional review due to fraud checks'
          : 'Registration submitted. Review within 24 hours.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
