/**
 * Safe database migration — adds missing columns without deleting data.
 * Run: npm run db:migrate
 */
import { PrismaClient } from '@prisma/client';
import { generateEntryCodeCandidate } from '../src/lib/crypto';

const prisma = new PrismaClient();

const migrations = [
  `ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "User" ADD COLUMN "gender" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "User" ADD COLUMN "hostelName" TEXT`,
  `ALTER TABLE "User" ADD COLUMN "profileComplete" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE "Ticket" ADD COLUMN "entryCode" TEXT`,
];

async function backfillEntryCodes() {
  const missing = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM "Ticket" WHERE entryCode IS NULL OR entryCode = ''`
  );

  if (missing.length === 0) {
    console.log('All tickets already have entry codes.');
    return;
  }

  const used = new Set(
    (
      await prisma.$queryRawUnsafe<Array<{ entryCode: string }>>(
        `SELECT entryCode FROM "Ticket" WHERE entryCode IS NOT NULL AND entryCode != ''`
      )
    ).map((t) => t.entryCode)
  );

  for (const row of missing) {
    let code = '';
    for (let i = 0; i < 30; i++) {
      const candidate = generateEntryCodeCandidate();
      if (!used.has(candidate)) {
        code = candidate;
        used.add(candidate);
        break;
      }
    }
    if (!code) throw new Error(`Could not generate entry code for ticket ${row.id}`);
    await prisma.ticket.update({ where: { id: row.id }, data: { entryCode: code } });
    console.log('Backfilled entryCode:', code, row.id);
  }
}

async function main() {
  for (const sql of migrations) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log('OK:', sql.slice(0, 60) + '...');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('duplicate column')) {
        console.log('SKIP (already exists):', sql.slice(0, 50) + '...');
      } else {
        console.error('FAIL:', msg);
      }
    }
  }

  await backfillEntryCodes();

  const orphaned = await prisma.user.findMany({ where: { passwordHash: '' } });
  if (orphaned.length > 0) {
    console.log(`Found ${orphaned.length} user(s) without password — these cannot log in.`);
  }

  console.log('\nMigration complete. Run: npx prisma db push && npx prisma generate');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
