import prisma from '@newsflow/database';

export async function createDistributionRequest(data: {
  agencyId: string;
  customerId: string;
  title: string;
  description?: string;
  requestedQuantity: number;
}) {
  return prisma.distributionRequest.create({ data });
}

export async function findDistributionRequestById(id: string, agencyId: string) {
  return prisma.distributionRequest.findFirst({
    where: { id, agencyId },
  });
}

export async function listDistributionRequests(agencyId: string) {
  return prisma.distributionRequest.findMany({
    where: { agencyId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateDistributionRequest(
  id: string,
  _agencyId: string,
  data: Record<string, unknown>
) {
  return prisma.distributionRequest.update({
    where: { id },
    data: data as never,
  });
}

export async function createArticleRequest(data: {
  agencyId: string;
  customerId: string;
  productId?: string;
  title: string;
  content: string;
  publishInDate?: Date;
}) {
  return prisma.articleRequest.create({
    data: data as never,
  });
}

export async function findArticleRequestById(id: string, agencyId: string) {
  return prisma.articleRequest.findFirst({
    where: { id, agencyId },
    include: { product: { select: { name: true } } },
  });
}

export async function listArticleRequests(agencyId: string) {
  return prisma.articleRequest.findMany({
    where: { agencyId },
    orderBy: { createdAt: 'desc' },
    include: { product: { select: { name: true } } },
  });
}

export async function updateArticleRequest(
  id: string,
  _agencyId: string,
  data: Record<string, unknown>
) {
  return prisma.articleRequest.update({
    where: { id },
    data: data as never,
    include: { product: { select: { name: true } } },
  });
}

export async function findCustomerById(id: string, agencyId: string) {
  return prisma.customer.findFirst({
    where: { id, agencyId, deletedAt: null },
  });
}
