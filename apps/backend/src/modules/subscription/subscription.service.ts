import { NotFoundError, ConflictError, ValidationError } from '@newsflow/shared';
import * as subscriptionRepository from './subscription.repository.js';
import { createAndQueueNotification } from '../../services/notification.service.js';
import { generateCancellationInvoice } from '../billing/billing.service.js';
import { logAudit } from '../../services/audit.service.js';
import type {
  CreateSubscriptionDto,
  PauseSubscriptionDto,
  SubscriptionResponse,
  SubscriptionPauseResponse,
} from './subscription.types.js';

function toSubscriptionResponse(sub: {
  id: string;
  agencyId: string;
  customerId: string;
  productId: string;
  startDate: Date;
  endDate: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  pauses?: Record<string, unknown>[];
}): SubscriptionResponse {
  return {
    id: sub.id,
    agencyId: sub.agencyId,
    customerId: sub.customerId,
    productId: sub.productId,
    startDate: sub.startDate,
    endDate: sub.endDate,
    status: sub.status,
    createdAt: sub.createdAt,
    updatedAt: sub.updatedAt,
  };
}

function toPauseResponse(pause: {
  id: string;
  agencyId: string;
  subscriptionId: string;
  startDate: Date;
  endDate: Date;
  reason: string | null;
  createdAt: Date;
  updatedAt: Date;
}): SubscriptionPauseResponse {
  return {
    id: pause.id,
    agencyId: pause.agencyId,
    subscriptionId: pause.subscriptionId,
    startDate: pause.startDate,
    endDate: pause.endDate,
    reason: pause.reason,
    createdAt: pause.createdAt,
    updatedAt: pause.updatedAt,
  };
}

export async function createSubscription(
  dto: CreateSubscriptionDto,
  agencyId: string
): Promise<SubscriptionResponse> {
  const customer = await subscriptionRepository.findCustomerById(dto.customerId, agencyId);
  if (!customer) {
    throw new NotFoundError('Customer');
  }

  const product = await subscriptionRepository.findProductById(dto.productId, agencyId);
  if (!product) {
    throw new NotFoundError('Product');
  }

  const existingActive = await subscriptionRepository.findActiveSubscription(
    dto.customerId,
    dto.productId,
    agencyId
  );
  if (existingActive) {
    throw new ConflictError('Active subscription already exists for this customer and product');
  }

  const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
  const endDate = dto.endDate ? new Date(dto.endDate) : undefined;

  const sub = await subscriptionRepository.createSubscription({
    customerId: dto.customerId,
    productId: dto.productId,
    agencyId,
    startDate,
    endDate,
  });

  const cust = await subscriptionRepository.findCustomerById(dto.customerId, agencyId);
  if (cust?.email) {
    createAndQueueNotification({
      agencyId,
      customerId: dto.customerId,
      type: 'SUBSCRIPTION_CREATED',
      channel: 'EMAIL',
      title: 'Subscription Started',
      message: `Your subscription to ${product.name} has been activated.`,
      emailTo: cust.email,
      emailSubject: `Subscription Started - ${product.name}`,
      templateData: {
        customerName: `${cust.firstName} ${cust.lastName}`,
        productName: product.name,
      },
    }).catch((err) => console.error('[SubscriptionService] Failed to queue notification:', err));
  }

  return toSubscriptionResponse(sub);
}

export async function getSubscription(id: string, agencyId: string): Promise<SubscriptionResponse> {
  const sub = await subscriptionRepository.findSubscriptionById(id, agencyId);
  if (!sub) {
    throw new NotFoundError('Subscription');
  }
  return toSubscriptionResponse(sub);
}

export async function cancelSubscription(
  id: string,
  agencyId: string,
  userId?: string
): Promise<SubscriptionResponse> {
  const sub = await subscriptionRepository.findSubscriptionById(id, agencyId);
  if (!sub) {
    throw new NotFoundError('Subscription');
  }

  if (sub.status !== 'ACTIVE') {
    throw new ConflictError('Only active subscriptions can be cancelled');
  }

  const cancelDate = new Date();

  const invoice = await generateCancellationInvoice(sub.customerId, agencyId, id, cancelDate);
  if (invoice) {
    console.log(`[SubscriptionService] Final invoice ${invoice.invoiceNumber} generated`);
  }

  const updated = await subscriptionRepository.cancelSubscriptionWithEndDate(
    id,
    agencyId,
    cancelDate
  );

  logAudit({
    agencyId,
    userId,
    entityType: 'Subscription',
    entityId: id,
    action: 'SUBSCRIPTION_CANCELLED',
    oldValue: { status: sub.status },
    newValue: { status: 'CANCELLED', endDate: cancelDate.toISOString() },
  });

  const cust = await subscriptionRepository.findCustomerById(sub.customerId, agencyId);
  if (cust?.email) {
    const product = await subscriptionRepository.findProductById(sub.productId, agencyId);
    createAndQueueNotification({
      agencyId,
      customerId: sub.customerId,
      type: 'SUBSCRIPTION_CANCELLED',
      channel: 'EMAIL',
      title: 'Subscription Cancelled',
      message: `Your subscription to ${product?.name ?? 'product'} has been cancelled.`,
      emailTo: cust.email,
      emailSubject: 'Subscription Cancelled - NewsFlow',
      templateData: {
        customerName: `${cust.firstName} ${cust.lastName}`,
        productName: product?.name ?? 'Product',
      },
    }).catch((err) => console.error('[SubscriptionService] Failed to queue notification:', err));
  }

  return toSubscriptionResponse(updated);
}

export async function pauseSubscription(
  id: string,
  dto: PauseSubscriptionDto,
  agencyId: string,
  userId?: string
): Promise<SubscriptionResponse> {
  const sub = await subscriptionRepository.findSubscriptionById(id, agencyId);
  if (!sub) {
    throw new NotFoundError('Subscription');
  }

  if (sub.status !== 'ACTIVE') {
    throw new ConflictError('Only active subscriptions can be paused');
  }

  const startDate = new Date(dto.startDate);
  const endDate = new Date(dto.endDate);

  if (endDate <= startDate) {
    throw new ValidationError('End date must be after start date');
  }

  const overlapping = await subscriptionRepository.findOverlappingPause(id, startDate, endDate);
  if (overlapping) {
    throw new ConflictError('Pause period overlaps with an existing pause');
  }

  await subscriptionRepository.createPause({
    subscriptionId: id,
    agencyId,
    startDate,
    endDate,
    reason: dto.reason,
  });

  const updated = await subscriptionRepository.updateSubscriptionStatus(id, agencyId, 'PAUSED');

  logAudit({
    agencyId,
    userId,
    entityType: 'Subscription',
    entityId: id,
    action: 'SUBSCRIPTION_PAUSED',
    oldValue: { status: sub.status },
    newValue: { status: 'PAUSED', pauseStart: dto.startDate, pauseEnd: dto.endDate },
  });

  const cust = await subscriptionRepository.findCustomerById(sub.customerId, agencyId);
  if (cust?.email) {
    createAndQueueNotification({
      agencyId,
      customerId: sub.customerId,
      type: 'SUBSCRIPTION_PAUSED',
      channel: 'EMAIL',
      title: 'Subscription Paused',
      message: 'Your subscription has been paused.',
      emailTo: cust.email,
      emailSubject: 'Subscription Paused - NewsFlow',
      templateData: {
        customerName: `${cust.firstName} ${cust.lastName}`,
      },
    }).catch((err) => console.error('[SubscriptionService] Failed to queue notification:', err));
  }

  return toSubscriptionResponse(updated);
}

export async function resumeSubscription(
  id: string,
  agencyId: string,
  userId?: string
): Promise<SubscriptionResponse> {
  const sub = await subscriptionRepository.findSubscriptionById(id, agencyId);
  if (!sub) {
    throw new NotFoundError('Subscription');
  }

  if (sub.status !== 'PAUSED') {
    throw new ConflictError('Only paused subscriptions can be resumed');
  }

  const updated = await subscriptionRepository.updateSubscriptionStatus(id, agencyId, 'ACTIVE');

  logAudit({
    agencyId,
    userId,
    entityType: 'Subscription',
    entityId: id,
    action: 'SUBSCRIPTION_RESUMED',
    oldValue: { status: sub.status },
    newValue: { status: 'ACTIVE' },
  });

  const cust = await subscriptionRepository.findCustomerById(sub.customerId, agencyId);
  if (cust?.email) {
    createAndQueueNotification({
      agencyId,
      customerId: sub.customerId,
      type: 'SUBSCRIPTION_RESUMED',
      channel: 'EMAIL',
      title: 'Subscription Resumed',
      message: 'Your subscription has been resumed.',
      emailTo: cust.email,
      emailSubject: 'Subscription Resumed - NewsFlow',
      templateData: {
        customerName: `${cust.firstName} ${cust.lastName}`,
      },
    }).catch((err) => console.error('[SubscriptionService] Failed to queue notification:', err));
  }

  return toSubscriptionResponse(updated);
}

export async function listSubscriptions(
  agencyId: string,
  customerId?: string
): Promise<SubscriptionResponse[]> {
  const subs = await subscriptionRepository.listSubscriptions(agencyId, customerId);
  return subs.map(toSubscriptionResponse);
}

export async function getPauseHistory(
  subscriptionId: string,
  agencyId: string
): Promise<SubscriptionPauseResponse[]> {
  const sub = await subscriptionRepository.findSubscriptionById(subscriptionId, agencyId);
  if (!sub) {
    throw new NotFoundError('Subscription');
  }

  return (sub.pauses ?? []).map(toPauseResponse);
}
