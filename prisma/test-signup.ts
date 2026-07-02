import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    const u = await prisma.user.create({
      data: {
        name: 'Test User',
        rollNo: '24-CS-888',
        email: 'test888@test.com',
        passwordHash: await bcrypt.hash('test123', 10),
      },
    });
    console.log('SUCCESS', u.id);
    await prisma.user.delete({ where: { id: u.id } });
  } catch (e) {
    console.error('ERROR:', e instanceof Error ? e.message : e);
  }
}

main().finally(() => prisma.$disconnect());
