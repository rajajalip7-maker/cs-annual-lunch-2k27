import { prisma } from './db';
import {
  generateTicketUid,
  signQrPayload,
  generateEntryCodeCandidate,
  normalizeEntryCode,
} from './crypto';
import { logAudit } from './audit';

async function generateUniqueEntryCode(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const entryCode = generateEntryCodeCandidate();
    const exists = await prisma.ticket.findUnique({ where: { entryCode } });
    if (!exists) return entryCode;
  }
  throw new Error('Could not generate unique entry code');
}

export async function generateTicketForPayment(paymentId: string, adminId?: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { user: true, ticket: true },
  });

  if (!payment || payment.status !== 'approved') {
    throw new Error('Payment must be approved before ticket generation');
  }

  if (payment.ticket) return payment.ticket;

  const ticketUid = generateTicketUid();
  const entryCode = await generateUniqueEntryCode();
  const { token } = await signQrPayload(ticketUid);

  const ticket = await prisma.ticket.create({
    data: {
      paymentId: payment.id,
      userId: payment.userId,
      ticketUid,
      entryCode,
      qrSignature: token,
      status: 'active',
    },
  });

  await logAudit({
    adminId,
    action: 'ticket_generated',
    targetTable: 'tickets',
    targetId: ticket.id,
    metadata: { ticketUid, entryCode, paymentId },
  });

  return ticket;
}

export async function processTicketScan(params: {
  qrToken: string;
  scannedBy: string;
  offline?: boolean;
}) {
  const { verifyQrToken } = await import('./crypto');
  const verification = await verifyQrToken(params.qrToken);

  if (!verification.valid || !verification.ticketUid) {
    return { success: false, error: 'Invalid or tampered QR code', code: 'INVALID_QR' };
  }

  const ticket = await prisma.ticket.findUnique({
    where: { ticketUid: verification.ticketUid },
    include: { user: true, payment: true },
  });

  if (!ticket) {
    return { success: false, error: 'Ticket not found', code: 'NOT_FOUND' };
  }

  return markTicketUsed(ticket, params.scannedBy, params.offline ?? false, 'ticket_scanned');
}

export async function manualOverrideEntry(params: {
  entryCode: string;
  adminId: string;
  reason: string;
}) {
  const code = normalizeEntryCode(params.entryCode);
  const ticket = await prisma.ticket.findUnique({
    where: { entryCode: code },
    include: { user: true, payment: true },
  });

  if (!ticket) {
    return { success: false, error: 'No ticket found with this ID', code: 'NOT_FOUND' };
  }

  if (ticket.status === 'used') {
    return {
      success: false,
      error: 'Ticket already used',
      code: 'ALREADY_USED',
    };
  }

  if (ticket.payment.status !== 'approved') {
    return { success: false, error: 'Payment not approved', code: 'NOT_APPROVED' };
  }

  const result = await markTicketUsed(ticket, params.adminId, false, 'manual_override_entry', params.reason);

  if (!result.success) return result;

  return {
    ...result,
    name: ticket.user.name,
    rollNo: ticket.user.rollNo,
    entryCode: ticket.entryCode,
  };
}

async function markTicketUsed(
  ticket: {
    id: string;
    ticketUid: string;
    entryCode: string;
    status: string;
    user: { name: string; rollNo: string; affiliation: string; accommodationType: string };
    payment: { status: string };
  },
  scannedBy: string,
  offline: boolean,
  auditAction: string,
  reason?: string
) {
  if (ticket.status === 'used') {
    return { success: false as const, error: 'Ticket already used', code: 'ALREADY_USED' };
  }

  if (ticket.payment.status !== 'approved') {
    return { success: false as const, error: 'Payment not approved', code: 'NOT_APPROVED' };
  }

  const updated = await prisma.ticket.updateMany({
    where: { id: ticket.id, status: 'active' },
    data: {
      status: 'used',
      scannedBy,
      scannedAt: new Date(),
    },
  });

  if (updated.count === 0) {
    return { success: false as const, error: 'Ticket was scanned by another gate (race)', code: 'RACE_LOST' };
  }

  await logAudit({
    adminId: scannedBy,
    action: auditAction,
    targetTable: 'tickets',
    targetId: ticket.id,
    reason,
    metadata: { offline, entryCode: ticket.entryCode },
  });

  return {
    success: true as const,
    ticket: {
      ticketUid: ticket.ticketUid,
      entryCode: ticket.entryCode,
      name: ticket.user.name,
      rollNo: ticket.user.rollNo,
      affiliation: ticket.user.affiliation,
      accommodationType: ticket.user.accommodationType,
    },
  };
}
