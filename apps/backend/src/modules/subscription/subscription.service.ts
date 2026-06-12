import { NotFoundError, ConflictError, ValidationError } from '@newsflow/shared';
import * as subscriptionRepository from './subscription.repository.js';
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
  agencyId: string
): Promise<SubscriptionResponse> {
  const sub = await subscriptionRepository.findSubscriptionById(id, agencyId);
  if (!sub) {
    throw new NotFoundError('Subscription');
  }

  if (sub.status !== 'ACTIVE') {
    throw new ConflictError('Only active subscriptions can be cancelled');
  }

  const updated = await subscriptionRepository.updateSubscriptionStatus(id, agencyId, 'CANCELLED');
  return toSubscriptionResponse(updated);
}

export async function pauseSubscription(
  id: string,
  dto: PauseSubscriptionDto,
  agencyId: string
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
  return toSubscriptionResponse(updated);
}

export async function resumeSubscription(
  id: string,
  agencyId: string
): Promise<SubscriptionResponse> {
  const sub = await subscriptionRepository.findSubscriptionById(id, agencyId);
  if (!sub) {
    throw new NotFoundError('Subscription');
  }

  if (sub.status !== 'PAUSED') {
    throw new ConflictError('Only paused subscriptions can be resumed');
  }

  const updated = await subscriptionRepository.updateSubscriptionStatus(id, agencyId, 'ACTIVE');
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
