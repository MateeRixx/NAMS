import prisma from '@newsflow/database';

export async function createSubscription(data: {
  customerId: string;
  productId: string;
  agencyId: string;
  startDate: Date;
  endDate?: Date;
  billingCycle?: 'MONTHLY' | 'YEARLY';
}) {
  return prisma.subscription.create({ data: data as never });
}

export async function findSubscriptionById(id: string, agencyId: string) {
  return prisma.subscription.findFirst({
    where: { id, agencyId },
    include: { pauses: { orderBy: { startDate: 'desc' } } },
  });
}

export async function findActiveSubscription(
  customerId: string,
  productId: string,
  agencyId: string
) {
  return prisma.subscription.findFirst({
    where: { customerId, productId, agencyId, status: 'ACTIVE' },
  });
}

export async function updateSubscriptionStatus(id: string, _agencyId: string, status: string) {
  return prisma.subscription.update({
    where: { id },
    data: { status: status as never },
  });
}

export async function cancelSubscriptionWithEndDate(id: string, agencyId: string, endDate: Date) {
  return prisma.subscription.update({
    where: { id, agencyId },
    data: { status: 'CANCELLED' as never, endDate },
  });
}

export async function listSubscriptions(agencyId: string, customerId?: string) {
  const where: Record<string, unknown> = { agencyId };
  if (customerId) {
    where['customerId'] = customerId;
  }

  return prisma.subscription.findMany({
    where: where as never,
    orderBy: { createdAt: 'desc' },
    include: { pauses: { orderBy: { startDate: 'desc' } } },
  });
}

export async function createPause(data: {
  subscriptionId: string;
  agencyId: string;
  startDate: Date;
  endDate: Date;
  reason?: string;
}) {
  return prisma.subscriptionPause.create({ data: data as never });
}

export async function findOverlappingPause(subscriptionId: string, startDate: Date, endDate: Date) {
  return prisma.subscriptionPause.findFirst({
    where: {
      subscriptionId,
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
  });
}

export async function findCustomerById(id: string, agencyId: string) {
  return prisma.customer.findFirst({
    where: { id, agencyId, deletedAt: null },
  });
}

export async function findProductById(id: string, agencyId: string) {
  return prisma.product.findFirst({
    where: { id, agencyId },
  });
}
