import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { unlink } from 'fs/promises';

export async function POST() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const retentionDays = parseInt(process.env.RETENTION_DAYS || '90', 10);
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const oldPayments = await prisma.payment.findMany({
    where: {
      createdAt: { lt: cutoff },
      status: { in: ['approved', 'rejected'] },
    },
    select: { id: true, filePath: true, fileName: true },
  });

  let deleted = 0;
  for (const payment of oldPayments) {
    try {
      await unlink(payment.filePath);
      deleted++;
    } catch {
      // file may already be gone
    }
  }

  return NextResponse.json({
    success: true,
    filesProcessed: oldPayments.length,
    filesDeleted: deleted,
    cutoff,
  });
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const overdue = await prisma.payment.findMany({
    where: {
      status: 'pending',
      slaDueAt: { lt: new Date() },
    },
    include: { user: { select: { name: true, rollNo: true } } },
  });

  return NextResponse.json({ overdueCount: overdue.length, overdue });
}
