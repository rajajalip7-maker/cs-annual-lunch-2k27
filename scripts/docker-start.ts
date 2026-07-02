import { execSync } from 'child_process';
import { mkdirSync, existsSync } from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

async function main() {
  const prismaDir = path.join(process.cwd(), 'prisma');
  const uploadsDir = path.join(process.cwd(), 'uploads', 'proofs');

  mkdirSync(prismaDir, { recursive: true });
  mkdirSync(uploadsDir, { recursive: true });

  const dbUrl = process.env.DATABASE_URL || 'file:./prisma/prod.db';
  if (!dbUrl.includes('prisma/')) {
    console.warn(
      'WARNING: DATABASE_URL should be file:./prisma/prod.db on Railway so data survives redeploys.'
    );
  }

  console.log('Applying database schema...');
  execSync('npx prisma db push', { stdio: 'inherit' });

  const prisma = new PrismaClient();
  try {
    const adminCount = await prisma.admin.count();
    if (adminCount === 0) {
      console.log('First boot — creating default admin accounts...');
      execSync('npm run db:seed', { stdio: 'inherit' });
    } else {
      console.log('Database already has data — skipping seed.');
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log('Starting app...');
  execSync('npm start', { stdio: 'inherit' });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
