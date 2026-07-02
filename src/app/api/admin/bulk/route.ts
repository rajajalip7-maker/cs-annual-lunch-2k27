import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { generateTicketForPayment } from '@/lib/tickets';
import { rejectionSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { ids, action, reason } = await request.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'No payments selected' }, { status: 400 });
  }

  if (action === 'reject') {
    const parsed = rejectionSchema.safeParse({ reason });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }
  }

  const results = [];
  for (const id of ids) {
    if (action === 'approve') {
      await prisma.payment.update({
        where: { id, status: { in: ['pending', 'flagged'] } },
        data: { status: 'approved', reviewedBy: session.adminId, reviewedAt: new Date() },
      });
      await logAudit({ adminId: session.adminId, action: 'bulk_approved', targetTable: 'payments', targetId: id });
      const ticket = await generateTicketForPayment(id, session.adminId);
      results.push({ id, ticket });
    } else if (action === 'reject') {
      await prisma.payment.update({
        where: { id },
        data: {
          status: 'rejected',
          reviewedBy: session.adminId,
          reviewedAt: new Date(),
          rejectionReason: reason,
        },
      });
      await logAudit({
        adminId: session.adminId,
        action: 'bulk_rejected',
        targetTable: 'payments',
        targetId: id,
        reason,
      });
      results.push({ id });
    }
  }

  return NextResponse.json({ success: true, processed: results.length, results });
}
