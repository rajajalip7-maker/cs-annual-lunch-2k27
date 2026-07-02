import { NextRequest, NextResponse } from 'next/server';
import { requireGateOrAdmin } from '@/lib/auth';
import { processTicketScan, manualOverrideEntry } from '@/lib/tickets';
import { manualOverrideSchema } from '@/lib/validation';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  const session = await requireGateOrAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  if (body.type === 'manual_override') {
    const parsed = manualOverrideSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }
    const result = await manualOverrideEntry({
      entryCode: parsed.data.entryCode,
      adminId: session.adminId,
      reason: parsed.data.reason,
    });
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  }

  const { qrToken, offline } = body;
  if (!qrToken) {
    return NextResponse.json({ error: 'QR token required' }, { status: 400 });
  }

  const result = await processTicketScan({
    qrToken,
    scannedBy: session.adminId,
    offline: offline ?? false,
  });

  if (!result.success && offline) {
    await prisma.gateScanQueue.create({
      data: {
        ticketUid: 'pending-sync',
        scannedBy: session.adminId,
        result: JSON.stringify({ qrToken, error: result.error }),
      },
    });
  }

  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}

export async function GET() {
  const session = await requireGateOrAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tickets = await prisma.ticket.findMany({
    where: { status: 'active' },
    include: {
      user: { select: { name: true, rollNo: true, accommodationType: true } },
      payment: { select: { status: true } },
    },
  });

  return NextResponse.json({
    syncedAt: new Date().toISOString(),
    tickets: tickets.map((t) => ({
      ticketUid: t.ticketUid,
      entryCode: t.entryCode,
      qrSignature: t.qrSignature,
      name: t.user.name,
      rollNo: t.user.rollNo,
      accommodationType: t.user.accommodationType,
    })),
  });
}
