import { NotFoundError, ValidationError } from '@newsflow/shared';
import * as marketplaceRepository from './marketplace.repository.js';
import { createAndQueueNotification } from '../../services/notification.service.js';
import { logAudit } from '../../services/audit.service.js';
import type {
  CreateDistributionRequestDto,
  UpdateDistributionRequestDto,
  DistributionRequestResponse,
  CreateArticleRequestDto,
  UpdateArticleRequestDto,
  ArticleRequestResponse,
} from './marketplace.types.js';

const DISTRIBUTION_VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['QUOTED', 'CANCELLED'],
  QUOTED: ['APPROVED', 'CANCELLED'],
  APPROVED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

const ARTICLE_VALID_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: ['PUBLISHED'],
  REJECTED: [],
  PUBLISHED: [],
};

function toDistributionResponse(d: {
  id: string;
  agencyId: string;
  customerId: string;
  title: string;
  description: string | null;
  requestedQuantity: number;
  deliveryAddressId: string | null;
  deliveryAddress?: {
    id: string;
    houseNumber: string;
    street: string;
    area: string;
    city: string;
    state: string;
    postalCode: string;
  } | null;
  contactPerson: string | null;
  contactPhone: string | null;
  scheduledDate: Date | null;
  quotedPrice: unknown;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  zones?: {
    id: string;
    deliveryZoneId: string;
    deliveryZone: { id: string; name: string };
    quantity: number;
  }[];
}): DistributionRequestResponse {
  return {
    id: d.id,
    agencyId: d.agencyId,
    customerId: d.customerId,
    title: d.title,
    description: d.description,
    requestedQuantity: d.requestedQuantity,
    deliveryAddressId: d.deliveryAddressId,
    deliveryAddress: d.deliveryAddress,
    contactPerson: d.contactPerson,
    contactPhone: d.contactPhone,
    scheduledDate: d.scheduledDate,
    quotedPrice: d.quotedPrice != null ? Number(d.quotedPrice) : null,
    status: d.status,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    zones: d.zones?.map((z) => ({
      id: z.id,
      deliveryZoneId: z.deliveryZoneId,
      deliveryZone: { id: z.deliveryZone.id, name: z.deliveryZone.name },
      quantity: z.quantity,
    })),
  };
}

function toArticleResponse(a: {
  id: string;
  agencyId: string;
  customerId: string;
  productId: string | null;
  title: string;
  content: string;
  status: string;
  publishInDate: Date | null;
  reviewNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  product?: { name: string } | null;
}): ArticleRequestResponse {
  return {
    id: a.id,
    agencyId: a.agencyId,
    customerId: a.customerId,
    productId: a.productId,
    title: a.title,
    content: a.content,
    status: a.status,
    publishInDate: a.publishInDate,
    reviewNotes: a.reviewNotes,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    product: a.product,
  };
}

export async function createDistributionRequest(
  dto: CreateDistributionRequestDto,
  agencyId: string
): Promise<DistributionRequestResponse> {
  const customer = await marketplaceRepository.findCustomerById(dto.customerId, agencyId);
  if (!customer) {
    throw new NotFoundError('Customer');
  }

  const request = await marketplaceRepository.createDistributionRequest({
    ...dto,
    agencyId,
  });

  if (customer.email) {
    createAndQueueNotification({
      agencyId,
      customerId: dto.customerId,
      type: 'DISTRIBUTION_REQUEST_CREATED',
      channel: 'EMAIL',
      title: 'Distribution Request Received',
      message: `Your distribution request "${dto.title}" has been received. We will provide a quotation shortly.`,
      emailTo: customer.email,
      emailSubject: 'Distribution Request Received - NewsFlow',
      templateData: {
        customerName: `${customer.firstName} ${customer.lastName}`,
        requestTitle: dto.title,
      },
    }).catch((err) => console.error('[MarketplaceService] Failed to queue notification:', err));
  }

  return toDistributionResponse(request);
}

export async function updateDistributionRequest(
  id: string,
  dto: UpdateDistributionRequestDto,
  agencyId: string,
  userId?: string
): Promise<DistributionRequestResponse> {
  const request = await marketplaceRepository.findDistributionRequestById(id, agencyId);
  if (!request) {
    throw new NotFoundError('DistributionRequest');
  }

  const updateData: Record<string, unknown> = {};

  if (dto.status) {
    const allowedTransitions = DISTRIBUTION_VALID_TRANSITIONS[request.status] ?? [];
    if (!allowedTransitions.includes(dto.status)) {
      throw new ValidationError(
        `Cannot transition from ${request.status} to ${dto.status}. ` +
          `Allowed transitions: ${allowedTransitions.join(', ') || 'none'}`
      );
    }
    updateData['status'] = dto.status;
  }

  if (dto.quotedPrice !== undefined) {
    if (request.status !== 'PENDING') {
      throw new ValidationError(
        'Cannot set quoted price after the request has moved from PENDING status'
      );
    }
    updateData['quotedPrice'] = dto.quotedPrice;
    updateData['status'] = 'QUOTED';
  }

  const updated = await marketplaceRepository.updateDistributionRequest(id, agencyId, updateData);

  logAudit({
    agencyId,
    userId,
    entityType: 'DistributionRequest',
    entityId: id,
    action:
      dto.quotedPrice !== undefined
        ? 'DISTRIBUTION_QUOTED'
        : `DISTRIBUTION_STATUS_CHANGED:${request.status}→${dto.status ?? request.status}`,
    oldValue: { status: request.status, quotedPrice: request.quotedPrice },
    newValue: updateData as Record<string, unknown>,
  });

  const customer = await marketplaceRepository.findCustomerById(request.customerId, agencyId);
  if (customer?.email && dto.status === 'QUOTED') {
    createAndQueueNotification({
      agencyId,
      customerId: request.customerId,
      type: 'DISTRIBUTION_REQUEST_QUOTED',
      channel: 'EMAIL',
      title: 'Quotation Ready',
      message: `Your distribution request "${request.title}" has been quoted at ₹${dto.quotedPrice ?? request.quotedPrice}.`,
      emailTo: customer.email,
      emailSubject: 'Distribution Quotation Ready - NewsFlow',
      templateData: {
        customerName: `${customer.firstName} ${customer.lastName}`,
        requestTitle: request.title,
      },
    }).catch((err) => console.error('[MarketplaceService] Failed to queue notification:', err));
  }

  return toDistributionResponse(updated);
}

export async function getDistributionRequest(
  id: string,
  agencyId: string
): Promise<DistributionRequestResponse> {
  const request = await marketplaceRepository.findDistributionRequestById(id, agencyId);
  if (!request) {
    throw new NotFoundError('DistributionRequest');
  }
  return toDistributionResponse(request);
}

export async function listDistributionRequests(
  agencyId: string
): Promise<DistributionRequestResponse[]> {
  const requests = await marketplaceRepository.listDistributionRequests(agencyId);
  return requests.map((r) => toDistributionResponse(r));
}

export async function createArticleRequest(
  dto: CreateArticleRequestDto,
  agencyId: string
): Promise<ArticleRequestResponse> {
  const customer = await marketplaceRepository.findCustomerById(dto.customerId, agencyId);
  if (!customer) {
    throw new NotFoundError('Customer');
  }

  const request = await marketplaceRepository.createArticleRequest({
    ...dto,
    agencyId,
    publishInDate: dto.publishInDate ? new Date(dto.publishInDate) : undefined,
  });

  if (customer.email) {
    createAndQueueNotification({
      agencyId,
      customerId: dto.customerId,
      type: 'ARTICLE_REQUEST_SUBMITTED',
      channel: 'EMAIL',
      title: 'Article Submitted',
      message: `Your article "${dto.title}" has been submitted for review.`,
      emailTo: customer.email,
      emailSubject: 'Article Submitted - NewsFlow',
      templateData: {
        customerName: `${customer.firstName} ${customer.lastName}`,
        articleTitle: dto.title,
      },
    }).catch((err) => console.error('[MarketplaceService] Failed to queue notification:', err));
  }

  return toArticleResponse(request);
}

export async function updateArticleRequest(
  id: string,
  dto: UpdateArticleRequestDto,
  agencyId: string,
  userId?: string
): Promise<ArticleRequestResponse> {
  const request = await marketplaceRepository.findArticleRequestById(id, agencyId);
  if (!request) {
    throw new NotFoundError('ArticleRequest');
  }

  const updateData: Record<string, unknown> = {};

  if (dto.status) {
    const allowedTransitions = ARTICLE_VALID_TRANSITIONS[request.status] ?? [];
    if (!allowedTransitions.includes(dto.status)) {
      throw new ValidationError(
        `Cannot transition from ${request.status} to ${dto.status}. ` +
          `Allowed transitions: ${allowedTransitions.join(', ') || 'none'}`
      );
    }
    updateData['status'] = dto.status;
  }

  if (dto.reviewNotes !== undefined) {
    updateData['reviewNotes'] = dto.reviewNotes;
  }

  const updated = await marketplaceRepository.updateArticleRequest(id, agencyId, updateData);

  logAudit({
    agencyId,
    userId,
    entityType: 'ArticleRequest',
    entityId: id,
    action: dto.status
      ? 'ARTICLE_STATUS_CHANGED:' + request.status + '->' + dto.status
      : 'ARTICLE_UPDATED',
    oldValue: { status: request.status, reviewNotes: request.reviewNotes },
    newValue: { status: dto.status, reviewNotes: dto.reviewNotes },
  });

  const customer = await marketplaceRepository.findCustomerById(request.customerId, agencyId);
  if (customer?.email && (dto.status === 'APPROVED' || dto.status === 'REJECTED')) {
    createAndQueueNotification({
      agencyId,
      customerId: request.customerId,
      type: dto.status === 'APPROVED' ? 'ARTICLE_APPROVED' : 'ARTICLE_REJECTED',
      channel: 'EMAIL',
      title: dto.status === 'APPROVED' ? 'Article Approved' : 'Article Rejected',
      message:
        dto.status === 'APPROVED'
          ? `Your article "${request.title}" has been approved.`
          : `Your article "${request.title}" has been rejected.`,
      emailTo: customer.email,
      emailSubject: `Article ${dto.status === 'APPROVED' ? 'Approved' : 'Rejected'} - NewsFlow`,
      templateData: {
        customerName: `${customer.firstName} ${customer.lastName}`,
        articleTitle: request.title,
      },
    }).catch((err) => console.error('[MarketplaceService] Failed to queue notification:', err));
  }

  return toArticleResponse(updated);
}

export async function getArticleRequest(
  id: string,
  agencyId: string
): Promise<ArticleRequestResponse> {
  const request = await marketplaceRepository.findArticleRequestById(id, agencyId);
  if (!request) {
    throw new NotFoundError('ArticleRequest');
  }
  return toArticleResponse(request);
}

export async function listArticleRequests(agencyId: string): Promise<ArticleRequestResponse[]> {
  const requests = await marketplaceRepository.listArticleRequests(agencyId);
  return requests.map((r) => toArticleResponse(r));
}
