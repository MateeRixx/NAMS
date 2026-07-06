import { NotFoundError } from '@newsflow/shared';
import prisma from '@newsflow/database';
import { createAndQueueNotification } from '../../../services/notification.service.js';

export async function listMyDistributionRequests(customerId: string, agencyId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, agencyId, deletedAt: null },
  });
  if (!customer) throw new NotFoundError('Customer');

  return prisma.distributionRequest.findMany({
    where: { customerId, agencyId },
    orderBy: { createdAt: 'desc' },
    include: {
      zones: { include: { deliveryZone: { select: { id: true, name: true } } } },
      deliveryAddress: { select: { id: true, houseNumber: true, street: true, area: true, city: true, state: true, postalCode: true } },
    },
  });
}

export async function createMyDistributionRequest(
  customerId: string,
  agencyId: string,
  data: { title: string; description?: string; requestedQuantity: number; deliveryAddressId?: string; contactPerson?: string; contactPhone?: string; scheduledDate?: string; zones?: { deliveryZoneId: string; quantity: number }[] }
) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, agencyId, deletedAt: null },
  });
  if (!customer) throw new NotFoundError('Customer');

  const request = await prisma.distributionRequest.create({
    data: {
      agencyId,
      customerId,
      title: data.title,
      description: data.description ?? null,
      requestedQuantity: data.requestedQuantity,
      deliveryAddressId: data.deliveryAddressId ?? null,
      contactPerson: data.contactPerson ?? null,
      contactPhone: data.contactPhone ?? null,
      scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
      status: 'PENDING',
      zones: data.zones
        ? {
            create: data.zones.map((z) => ({
              deliveryZoneId: z.deliveryZoneId,
              quantity: z.quantity,
            })),
          }
        : undefined,
    },
    include: {
      zones: { include: { deliveryZone: { select: { id: true, name: true } } } },
      deliveryAddress: { select: { id: true, houseNumber: true, street: true, area: true, city: true, state: true, postalCode: true } },
    },
  });

  if (customer.email) {
    createAndQueueNotification({
      agencyId,
      customerId,
      type: 'DISTRIBUTION_REQUEST_CREATED',
      channel: 'EMAIL',
      title: 'Distribution Request Received',
      message: `Your distribution request "${data.title}" has been received.`,
      emailTo: customer.email,
      emailSubject: 'Distribution Request Received - NewsFlow',
      templateData: {
        customerName: `${customer.firstName} ${customer.lastName}`,
        requestTitle: data.title,
      },
    }).catch(() => {});
  }

  return request;
}

export async function listMyArticleRequests(customerId: string, agencyId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, agencyId, deletedAt: null },
  });
  if (!customer) throw new NotFoundError('Customer');

  return prisma.articleRequest.findMany({
    where: { customerId, agencyId },
    orderBy: { createdAt: 'desc' },
    include: { product: { select: { name: true } } },
  });
}

export async function createMyArticleRequest(
  customerId: string,
  agencyId: string,
  data: { productId?: string; title: string; content: string; publishInDate?: string }
) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, agencyId, deletedAt: null },
  });
  if (!customer) throw new NotFoundError('Customer');

  const request = await prisma.articleRequest.create({
    data: {
      agencyId,
      customerId,
      productId: data.productId ?? null,
      title: data.title,
      content: data.content,
      publishInDate: data.publishInDate ? new Date(data.publishInDate) : null,
      status: 'SUBMITTED',
    },
  });

  if (customer.email) {
    createAndQueueNotification({
      agencyId,
      customerId,
      type: 'ARTICLE_REQUEST_SUBMITTED',
      channel: 'EMAIL',
      title: 'Article Submitted',
      message: `Your article "${data.title}" has been submitted for review.`,
      emailTo: customer.email,
      emailSubject: 'Article Submitted - NewsFlow',
      templateData: {
        customerName: `${customer.firstName} ${customer.lastName}`,
        articleTitle: data.title,
      },
    }).catch(() => {});
  }

  return request;
}
