import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateTicketPng, generateTicketSvg } from '@/lib/ticket-render';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const { paymentId } = await params;
  const format = request.nextUrl.searchParams.get('format');

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { user: true, ticket: true },
  });

  if (!payment || payment.status !== 'approved' || !payment.ticket) {
    return NextResponse.json({ error: 'Ticket not available' }, { status: 403 });
  }

  const renderData = {
    name: payment.user.name,
    rollNo: payment.user.rollNo,
    ticketUid: payment.ticket.ticketUid,
    entryCode: payment.ticket.entryCode,
    accommodationType: payment.user.accommodationType,
    qrSignature: payment.ticket.qrSignature,
  };

  try {
    if (format === 'svg') {
      const svg = await generateTicketSvg(renderData);
      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Content-Disposition': `attachment; filename="ticket-${payment.user.rollNo}.svg"`,
        },
      });
    }

    const png = await generateTicketPng(renderData);
    return new NextResponse(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="ticket-${payment.user.rollNo}.png"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Ticket image generation failed:', error);
    const svg = await generateTicketSvg(renderData);
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': `attachment; filename="ticket-${payment.user.rollNo}.svg"`,
      },
    });
  }
}
