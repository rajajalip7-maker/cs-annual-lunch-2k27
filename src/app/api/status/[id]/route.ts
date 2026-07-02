import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSlaStatus, formatSlaRemaining } from '@/lib/sla';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, rollNo: true, email: true, accommodationType: true } },
      ticket: { select: { id: true, ticketUid: true, status: true, issuedAt: true } },
    },
  });

  if (!payment) {
    return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
  }

  const sla = getSlaStatus(payment.slaDueAt);

  return NextResponse.json({
    id: payment.id,
    status: payment.status,
    rejectionReason: payment.rejectionReason,
    flaggedReason: payment.flaggedReason,
    amount: payment.amount,
    transactionId: payment.transactionId,
    createdAt: payment.createdAt,
    reviewedAt: payment.reviewedAt,
    sla: {
      dueAt: payment.slaDueAt,
      status: sla.status,
      label: sla.label,
      remaining: formatSlaRemaining(sla.hoursRemaining),
    },
    user: payment.user,
    ticket: payment.ticket,
  });
}
