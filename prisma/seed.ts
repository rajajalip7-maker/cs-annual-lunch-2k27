import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
  const gatePassword = process.env.GATE_DEFAULT_PASSWORD || 'gate123';

  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      name: 'System Administrator',
      role: 'admin',
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
  });

  await prisma.admin.upsert({
    where: { username: 'gate1' },
    update: {},
    create: {
      username: 'gate1',
      name: 'Gate Staff 1',
      role: 'gate_staff',
      passwordHash: await bcrypt.hash(gatePassword, 10),
    },
  });

  console.log('Seeded admin (admin/admin123) and gate staff (gate1/gate123)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
