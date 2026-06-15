import prisma from '@newsflow/database';

export async function findNotificationById(id: string, agencyId: string) {
  return prisma.notification.findFirst({
    where: { id, agencyId },
  });
}

export async function listNotifications(
  agencyId: string,
  customerId?: string,
  options?: { limit?: number; offset?: number }
) {
  const where: Record<string, unknown> = { agencyId };
  if (customerId) where['customerId'] = customerId;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: where as never,
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    }),
    prisma.notification.count({ where: where as never }),
  ]);

  return { notifications, total };
}

export async function countUnread(agencyId: string, customerId?: string): Promise<number> {
  const where: Record<string, unknown> = { agencyId, status: 'PENDING' };
  if (customerId) where['customerId'] = customerId;
  return prisma.notification.count({ where: where as never });
}
