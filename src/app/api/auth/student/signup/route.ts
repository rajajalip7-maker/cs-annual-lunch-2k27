import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { createStudentSessionToken } from '@/lib/crypto';
import { signupSchema } from '@/lib/validation';
import { STUDENT_SESSION_COOKIE } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { name, rollNo, email, password } = parsed.data;
    const passwordHash = await bcrypt.hash(password, 10);

    const existingRoll = await prisma.user.findUnique({ where: { rollNo } });
    const existingEmail = await prisma.user.findUnique({ where: { email } });

    if (existingRoll && existingRoll.passwordHash) {
      return NextResponse.json({ error: 'Roll number already registered' }, { status: 409 });
    }

    if (existingEmail && existingEmail.passwordHash && existingEmail.id !== existingRoll?.id) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    let user;
    if (existingRoll && !existingRoll.passwordHash) {
      // Upgrade old account (created before login system) with a password
      user = await prisma.user.update({
        where: { id: existingRoll.id },
        data: { name, email, passwordHash },
      });
    } else {
      user = await prisma.user.create({
        data: { name, rollNo, email, passwordHash },
      });
    }

    const token = await createStudentSessionToken(user.id);
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, rollNo: user.rollNo, email: user.email },
    });

    response.cookies.set(STUDENT_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === 'development'
            ? `Account creation failed: ${detail}`
            : 'Account creation failed. Please try again.',
      },
      { status: 500 }
    );
  }
}
