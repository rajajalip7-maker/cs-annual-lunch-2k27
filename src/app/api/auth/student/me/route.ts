import { NextResponse } from 'next/server';
import { requireStudent } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getSlaStatus, formatSlaRemaining } from '@/lib/sla';

export async function GET() {
  const session = await requireStudent();
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { ticket: { select: { id: true, ticketUid: true, status: true, issuedAt: true } } },
      },
    },
  });

  if (!user) return NextResponse.json({ authenticated: false }, { status: 401 });

  const payment = user.payments[0] ?? null;
  const sla = payment ? getSlaStatus(payment.slaDueAt) : null;

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      name: user.name,
      rollNo: user.rollNo,
      email: user.email,
      gender: user.gender,
      accommodationType: user.accommodationType,
      hostelName: user.hostelName,
      profileComplete: user.profileComplete,
    },
    payment: payment
      ? {
          id: payment.id,
          status: payment.status,
          rejectionReason: payment.rejectionReason,
          flaggedReason: payment.flaggedReason,
          amount: payment.amount,
          createdAt: payment.createdAt,
          reviewedAt: payment.reviewedAt,
          sla: {
            status: sla!.status,
            label: sla!.label,
            remaining: formatSlaRemaining(sla!.hoursRemaining),
          },
          ticket: payment.ticket,
        }
      : null,
  });
}
