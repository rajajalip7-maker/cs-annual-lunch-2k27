import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getSlaStatus } from '@/lib/sla';

export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'all';
  const search = searchParams.get('search') || '';
  const gender = searchParams.get('gender') || 'all';

  const where: Record<string, unknown> = {};
  if (status !== 'all') where.status = status;

  if (gender !== 'all' && search) {
    where.AND = [
      { user: { gender } },
      {
        OR: [
          { transactionId: { contains: search } },
          { user: { rollNo: { contains: search } } },
          { user: { name: { contains: search } } },
          { user: { mobile: { contains: search } } },
        ],
      },
    ];
  } else if (gender !== 'all') {
    where.user = { gender };
  } else if (search) {
    where.OR = [
      { transactionId: { contains: search } },
      { user: { rollNo: { contains: search } } },
      { user: { name: { contains: search } } },
      { user: { mobile: { contains: search } } },
    ];
  }

  const payments = await prisma.payment.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          rollNo: true,
          mobile: true,
          gender: true,
          accommodationType: true,
          hostelName: true,
        },
      },
      ticket: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const enriched = payments.map((p) => ({
    ...p,
    sla: getSlaStatus(p.slaDueAt),
  }));

  const counts = await prisma.payment.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  const overdue = payments.filter((p) => p.status === 'pending' && getSlaStatus(p.slaDueAt).status === 'overdue').length;

  return NextResponse.json({ payments: enriched, counts, overdue });
}
