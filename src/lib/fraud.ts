import { prisma } from './db';

const RATE_LIMIT = parseInt(process.env.RATE_LIMIT_PER_HOUR || '5', 10);
const WINDOW_MS = 60 * 60 * 1000;

export async function checkRateLimit(key: string): Promise<{ allowed: boolean; remaining: number }> {
  const now = new Date();
  const entry = await prisma.rateLimitEntry.findUnique({ where: { key } });

  if (!entry) {
    await prisma.rateLimitEntry.create({ data: { key, count: 1, windowStart: now } });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  const elapsed = now.getTime() - entry.windowStart.getTime();
  if (elapsed > WINDOW_MS) {
    await prisma.rateLimitEntry.update({
      where: { key },
      data: { count: 1, windowStart: now },
    });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  await prisma.rateLimitEntry.update({
    where: { key },
    data: { count: entry.count + 1 },
  });
  return { allowed: true, remaining: RATE_LIMIT - entry.count - 1 };
}

export async function runFraudChecks(params: {
  transactionId: string;
  fileHash: string;
  mobile: string;
  amount: number;
}) {
  const flags: string[] = [];

  const duplicateHash = await prisma.payment.findFirst({
    where: { fileHash: params.fileHash, status: { not: 'rejected' } },
  });
  if (duplicateHash) flags.push('Duplicate payment screenshot detected');

  const similarPayments = await prisma.payment.findMany({
    where: {
      status: { in: ['pending', 'approved', 'flagged'] },
      amount: params.amount,
      user: { mobile: params.mobile },
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    include: { user: true },
    take: 3,
  });
  if (similarPayments.length > 0) {
    flags.push('Similar payment from same phone within 24 hours');
  }

  return flags;
}
