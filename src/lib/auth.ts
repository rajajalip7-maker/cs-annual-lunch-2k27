import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { verifySessionToken, verifyStudentSessionToken } from './crypto';

export const SESSION_COOKIE = 'event_session';
export const STUDENT_SESSION_COOKIE = 'student_session';

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session.valid) return null;
  return { adminId: session.adminId!, role: session.role! };
}

export async function getStudentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(STUDENT_SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await verifyStudentSessionToken(token);
  if (!session.valid) return null;
  return { userId: session.userId!, role: 'student' as const };
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session || session.role !== 'admin') return null;
  return session;
}

export async function requireStudent() {
  const session = await getStudentSession();
  if (!session) return null;
  return session;
}

export async function requireGateOrAdmin() {
  const session = await getAdminSession();
  if (!session) return null;
  return session;
}

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

// Legacy alias
export const getSession = getAdminSession;
