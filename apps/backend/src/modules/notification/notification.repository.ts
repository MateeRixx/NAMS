import prisma from '@newsflow/database';

export async function findNotificationById(id: string, agencyId: string) {
  return prisma.notification.findFirst({
    where: { id, agencyId },
  });
}

export async function listNotifications(
  agencyId: string,
  customerId?: string,
  options?: { limit?: number; offset?: number; channel?: string; area?: string; zoneId?: string }
) {
  const where: Record<string, unknown> = { agencyId };
  if (customerId) where['customerId'] = customerId;
  if (options?.channel) where['channel'] = options.channel;
  const addressFilter: Record<string, string> = {};
  if (options?.area) addressFilter['area'] = options.area;
  if (options?.zoneId) addressFilter['zoneId'] = options.zoneId;
  if (Object.keys(addressFilter).length > 0) {
    where['customer'] = { addresses: { some: addressFilter } };
  }

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

export async function createNotification(data: {
  agencyId: string;
  customerId?: string;
  type: string;
  channel: string;
  title: string;
  message: string;
  status?: string;
}) {
  return prisma.notification.create({ data: data as never });
}
