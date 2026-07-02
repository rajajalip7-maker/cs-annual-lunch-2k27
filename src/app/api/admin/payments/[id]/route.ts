import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { generateTicketForPayment } from '@/lib/tickets';
import { rejectionSchema } from '@/lib/validation';
import { getSlaStatus } from '@/lib/sla';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      user: true,
      ticket: true,
    },
  });

  if (!payment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const auditLogs = await prisma.auditLog.findMany({
    where: { targetId: id },
    orderBy: { createdAt: 'desc' },
    include: { admin: { select: { name: true } } },
  });

  return NextResponse.json({
    payment: { ...payment, sla: getSlaStatus(payment.slaDueAt) },
    auditLogs,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const action = body.action as 'approve' | 'reject' | 'unflag';

  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (action === 'approve') {
    const updated = await prisma.payment.update({
      where: { id },
      data: {
        status: 'approved',
        reviewedBy: session.adminId,
        reviewedAt: new Date(),
        rejectionReason: null,
      },
    });

    await logAudit({
      adminId: session.adminId,
      action: 'payment_approved',
      targetTable: 'payments',
      targetId: id,
    });

    const ticket = await generateTicketForPayment(id, session.adminId);

    return NextResponse.json({ success: true, payment: updated, ticket });
  }

  if (action === 'reject') {
    const parsed = rejectionSchema.safeParse({ reason: body.reason });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        status: 'rejected',
        reviewedBy: session.adminId,
        reviewedAt: new Date(),
        rejectionReason: parsed.data.reason,
      },
    });

    await logAudit({
      adminId: session.adminId,
      action: 'payment_rejected',
      targetTable: 'payments',
      targetId: id,
      reason: parsed.data.reason,
    });

    return NextResponse.json({ success: true, payment: updated });
  }

  if (action === 'unflag') {
    const updated = await prisma.payment.update({
      where: { id },
      data: { status: 'pending', flaggedReason: null },
    });

    await logAudit({
      adminId: session.adminId,
      action: 'payment_unflagged',
      targetTable: 'payments',
      targetId: id,
      reason: body.reason,
    });

    return NextResponse.json({ success: true, payment: updated });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
