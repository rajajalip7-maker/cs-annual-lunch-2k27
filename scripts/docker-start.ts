import { mkdirSync, existsSync, statSync } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { getDatabaseUrl, getPersistRoot, getUploadDir } from '../src/lib/paths';

async function main() {
  const persistRoot = getPersistRoot();
  const uploadDir = getUploadDir();

  mkdirSync(persistRoot, { recursive: true });
  mkdirSync(uploadDir, { recursive: true });

  process.env.DATABASE_URL = getDatabaseUrl();
  console.log('Persist root:', persistRoot);
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  console.log('Upload dir:', uploadDir);

  const dbPath = process.env.DATABASE_URL.replace(/^file:/, '');
  if (existsSync(dbPath)) {
    const { size } = statSync(dbPath);
    console.log(`Database file exists (${Math.round(size / 1024)} KB)`);
  } else {
    console.log('New database file will be created on first registration.');
    if (!process.env.RAILWAY_VOLUME_MOUNT_PATH) {
      console.warn('WARNING: No Railway volume detected. Add a volume at /app/data or data is lost on redeploy.');
    }
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
    console.log(`Records — admins: ${adminCount}, users: ${userCount}, payments: ${paymentCount}`);

    if (adminCount === 0) {
      console.log('Creating default admin accounts...');
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
