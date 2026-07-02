import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { createStudentSessionToken } from '@/lib/crypto';
import { studentLoginSchema } from '@/lib/validation';
import { normalizeRollNo } from '@/lib/event';
import { STUDENT_SESSION_COOKIE } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = studentLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { rollNo: normalizeRollNo(parsed.data.rollNo) },
  });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: 'Invalid roll number or password' }, { status: 401 });
  }

  const token = await createStudentSessionToken(user.id);
  const response = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      rollNo: user.rollNo,
      profileComplete: user.profileComplete,
    },
  });

  response.cookies.set(STUDENT_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(STUDENT_SESSION_COOKIE);
  return response;
}
