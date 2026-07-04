import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { buildCsv, exportFilterLabel } from '@/lib/csv';

function accommodationLabel(type: string) {
  if (type === 'hostellite') return 'Hostellite';
  if (type === 'day_scholar') return 'Day Scholar';
  return '';
}

export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const gender = searchParams.get('gender') || 'all';
  const accommodation = searchParams.get('accommodation') || 'all';
  const status = searchParams.get('status') || 'all';

  const where: {
    profileComplete: boolean;
    gender?: string;
    accommodationType?: string;
  } = { profileComplete: true };

  if (gender !== 'all') where.gender = gender;
  if (accommodation !== 'all') where.accommodationType = accommodation;

  const users = await prisma.user.findMany({
    where,
    orderBy: [{ gender: 'asc' }, { accommodationType: 'asc' }, { name: 'asc' }],
    include: {
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { status: true, transactionId: true, createdAt: true },
      },
    },
  });

  const filtered =
    status === 'all'
      ? users
      : users.filter((u) => u.payments[0]?.status === status);

  const headers = [
    'Name',
    'Roll No',
    'Phone',
    'Gender',
    'Type',
    'Hostel',
    'Payment Status',
    'Registered At',
  ];

  const rows = filtered.map((u) => {
    const payment = u.payments[0];
    return [
      u.name,
      u.rollNo,
      u.mobile,
      u.gender === 'male' ? 'Boy' : u.gender === 'female' ? 'Girl' : u.gender,
      accommodationLabel(u.accommodationType),
      u.accommodationType === 'hostellite' ? u.hostelName || '' : '',
      payment?.status || 'no payment',
      payment?.createdAt.toISOString().slice(0, 10) || u.createdAt.toISOString().slice(0, 10),
    ];
  });

  const csv = buildCsv(headers, rows);
  const label = exportFilterLabel(gender, accommodation);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `cs-annual-lunch-students-${label}-${date}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
