import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { createSessionToken } from '@/lib/crypto';
import { loginSchema } from '@/lib/validation';
import { SESSION_COOKIE } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
  }

  const admin = await prisma.admin.findUnique({ where: { username: parsed.data.username } });
  if (!admin || !(await bcrypt.compare(parsed.data.password, admin.passwordHash))) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  const token = await createSessionToken(admin.id, admin.role);
  const response = NextResponse.json({
    success: true,
    admin: { name: admin.name, role: admin.role },
  });

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
