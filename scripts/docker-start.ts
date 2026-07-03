import { execSync } from 'child_process';
import { mkdirSync, existsSync, statSync } from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const PRODUCTION_DB_PATH = '/app/prisma/prod.db';
const PRODUCTION_DB_URL = `file:${PRODUCTION_DB_PATH}`;

async function main() {
  const prismaDir = path.join(process.cwd(), 'prisma');
  const uploadsDir = path.join(process.cwd(), 'uploads', 'proofs');

  mkdirSync(prismaDir, { recursive: true });
  mkdirSync(uploadsDir, { recursive: true });

  if (process.env.NODE_ENV === 'production') {
    process.env.DATABASE_URL = PRODUCTION_DB_URL;
    console.log('DATABASE_URL (production):', PRODUCTION_DB_URL);
  } else {
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./prisma/prod.db';
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
  }

  const dbPath = process.env.DATABASE_URL.replace(/^file:/, '');
  if (existsSync(dbPath)) {
    const { size } = statSync(dbPath);
    console.log(`Database file exists (${Math.round(size / 1024)} KB): ${dbPath}`);
  } else {
    console.log(`Database file will be created: ${dbPath}`);
    console.log(
      'TIP: On Railway, add a Volume mounted at /app/prisma or data is lost on every redeploy.'
    );
  }

  console.log('Applying database schema...');
  execSync('npx prisma db push', { stdio: 'inherit', env: process.env });

  const prisma = new PrismaClient();
  try {
    const [adminCount, userCount, paymentCount] = await Promise.all([
      prisma.admin.count(),
      prisma.user.count(),
      prisma.payment.count(),
    ]);
    console.log(`Records in DB — admins: ${adminCount}, users: ${userCount}, payments: ${paymentCount}`);

    if (adminCount === 0) {
      console.log('First boot — creating default admin accounts...');
      execSync('npm run db:seed', { stdio: 'inherit', env: process.env });
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log('Starting app...');
  execSync('npm start', { stdio: 'inherit', env: process.env });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
