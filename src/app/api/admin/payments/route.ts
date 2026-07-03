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
  const accommodation = searchParams.get('accommodation') || 'all';

  const where: Record<string, unknown> = {};
  if (status !== 'all') where.status = status;

  const userWhere: Record<string, string> = {};
  if (gender !== 'all') userWhere.gender = gender;
  if (accommodation !== 'all') userWhere.accommodationType = accommodation;

  const searchOr = search
    ? [
        { transactionId: { contains: search } },
        { user: { rollNo: { contains: search } } },
        { user: { name: { contains: search } } },
        { user: { mobile: { contains: search } } },
      ]
    : null;

  if (Object.keys(userWhere).length > 0 && searchOr) {
    where.AND = [{ user: userWhere }, { OR: searchOr }];
  } else if (Object.keys(userWhere).length > 0) {
    where.user = userWhere;
  } else if (searchOr) {
    where.OR = searchOr;
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
