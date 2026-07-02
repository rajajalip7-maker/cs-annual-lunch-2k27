import { prisma } from './db';

export async function logAudit(params: {
  adminId?: string | null;
  action: string;
  targetTable: string;
  targetId: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.auditLog.create({
    data: {
      adminId: params.adminId || null,
      action: params.action,
      targetTable: params.targetTable,
      targetId: params.targetId,
      reason: params.reason || null,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });
}

export async function getAuditLogs(targetId?: string, limit = 50) {
  return prisma.auditLog.findMany({
    where: targetId ? { targetId } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { admin: { select: { name: true, username: true, role: true } } },
  });
}
