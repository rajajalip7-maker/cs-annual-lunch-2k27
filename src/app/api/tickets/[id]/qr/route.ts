import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import QRCode from 'qrcode';
import { EVENT } from '@/lib/event';
import { generateTicketPng, generateTicketSvg } from '@/lib/ticket-render';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const format = request.nextUrl.searchParams.get('format');

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

  const renderData = {
    name: ticket.user.name,
    rollNo: ticket.user.rollNo,
    ticketUid: ticket.ticketUid,
    entryCode: ticket.entryCode,
    accommodationType: ticket.user.accommodationType,
    qrSignature: ticket.qrSignature,
  };

  if (format === 'png') {
    try {
      const png = await generateTicketPng(renderData);
      return new NextResponse(new Uint8Array(png), {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `attachment; filename="ticket-${ticket.user.rollNo}.png"`,
        },
      });
    } catch (error) {
      console.error('PNG generation failed, falling back to SVG:', error);
      const svg = await generateTicketSvg(renderData);
      return new NextResponse(svg, {
        headers: { 'Content-Type': 'image/svg+xml' },
      });
    }
  }

  const qrDataUrl = await QRCode.toDataURL(ticket.qrSignature, {
    width: 400,
    margin: 2,
    color: { dark: '#0f172a', light: '#ffffff' },
  });

  return NextResponse.json({
    event: EVENT,
    ticket: {
      id: ticket.id,
      ticketUid: ticket.ticketUid,
      entryCode: ticket.entryCode,
      status: ticket.status,
      user: ticket.user,
    },
    qrDataUrl,
    downloadUrl: `/api/tickets/${id}/qr?format=png`,
  });
}
