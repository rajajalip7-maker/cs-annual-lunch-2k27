import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ authenticated: false });

  const admin = await prisma.admin.findUnique({
    where: { id: session.adminId },
    select: { id: true, name: true, username: true, role: true },
  });

  return NextResponse.json({ authenticated: true, admin });
}
