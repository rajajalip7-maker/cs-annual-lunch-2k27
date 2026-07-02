import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import QRCode from 'qrcode';
import { EVENT } from '@/lib/event';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const { paymentId } = await params;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      user: true,
      ticket: true,
    },
  });

  if (!payment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (payment.status !== 'approved' || !payment.ticket) {
    return NextResponse.json({ error: 'Ticket not available' }, { status: 403 });
  }

  const qrDataUrl = await QRCode.toDataURL(payment.ticket.qrSignature, {
    width: 400,
    margin: 2,
    color: { dark: '#0f172a', light: '#ffffff' },
  });

  return NextResponse.json({
    event: EVENT,
    ticket: {
      id: payment.ticket.id,
      ticketUid: payment.ticket.ticketUid,
      entryCode: payment.ticket.entryCode,
      status: payment.ticket.status,
      issuedAt: payment.ticket.issuedAt,
    },
    user: {
      name: payment.user.name,
      rollNo: payment.user.rollNo,
      accommodationType: payment.user.accommodationType,
    },
    qrDataUrl,
    downloadUrl: `/api/tickets/by-payment/${paymentId}/image`,
  });
}
