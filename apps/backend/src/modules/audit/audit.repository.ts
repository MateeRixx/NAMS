import prisma from '@newsflow/database';

export async function listAuditLogs(agencyId: string, limit = 100, offset = 0) {
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { agencyId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count({ where: { agencyId } }),
  ]);
  return { logs, total };
}

export async function findAuditLogById(id: string, agencyId: string) {
  return prisma.auditLog.findFirst({
    where: { id, agencyId },
  });
}
