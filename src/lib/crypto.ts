import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { v4 as uuidv4 } from 'uuid';

const QR_SECRET = () =>
  new TextEncoder().encode(process.env.QR_HMAC_SECRET || 'dev-qr-secret');
const JWT_SECRET = () =>
  new TextEncoder().encode(process.env.JWT_SECRET || 'dev-jwt-secret');

export function generateTicketUid(): string {
  return uuidv4();
}

const ENTRY_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateEntryCodeCandidate(): string {
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += ENTRY_CHARS[Math.floor(Math.random() * ENTRY_CHARS.length)];
  }
  return `CS27-${suffix}`;
}

export function normalizeEntryCode(code: string): string {
  return code.trim().toUpperCase();
}

export async function signQrPayload(ticketUid: string, eventId = 'cs-annual-lunch-2k27') {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 60 * 60 * 24 * 30; // 30 days

  const token = await new SignJWT({ ticketUid, eventId, iat: issuedAt, exp: expiresAt })
    .setProtectedHeader({ alg: 'HS256' })
    .sign(QR_SECRET());

  return { token, issuedAt, expiresAt };
}

export async function verifyQrToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, QR_SECRET());
    return {
      valid: true,
      ticketUid: payload.ticketUid as string,
      eventId: payload.eventId as string,
      exp: payload.exp as number,
    };
  } catch {
    return { valid: false as const, ticketUid: null, eventId: null, exp: null };
  }
}

export function hashFileContent(buffer: Buffer): string {
  return createHmac('sha256', process.env.QR_HMAC_SECRET || 'hash-salt')
    .update(buffer)
    .digest('hex');
}

export function generateTrackingToken(): string {
  return randomBytes(16).toString('hex');
}

export function secureCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export async function createSessionToken(adminId: string, role: string) {
  return new SignJWT({ adminId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .sign(JWT_SECRET());
}

export async function createStudentSessionToken(userId: string) {
  return new SignJWT({ userId, role: 'student' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(JWT_SECRET());
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET());
    return {
      valid: true,
      adminId: payload.adminId as string,
      role: payload.role as string,
    };
  } catch {
    return { valid: false as const, adminId: null, role: null };
  }
}

export async function verifyStudentSessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET());
    if (payload.role !== 'student') {
      return { valid: false as const, userId: null };
    }
    return {
      valid: true,
      userId: payload.userId as string,
    };
  } catch {
    return { valid: false as const, userId: null };
  }
}
