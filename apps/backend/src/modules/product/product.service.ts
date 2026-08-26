import { NotFoundError, ConflictError } from '@newsflow/shared';
import * as productRepository from './product.repository.js';
import { logAudit } from '../../services/audit.service.js';
import type {
  CreateProductDto,
  UpdateProductDto,
  ProductResponse,
  CreateDayRateDto,
  UpdateDayRateDto,
  DayRateResponse,
} from './product.types.js';

function toProductResponse(product: {
  id: string;
  agencyId: string;
  name: string;
  description: string | null;
  type: string;
  frequency: string;
  basePrice: { toString: () => string };
  subscriptionMonthlyPrice: { toString: () => string } | null;
  subscriptionYearlyPrice: { toString: () => string } | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ProductResponse {
  return {
    id: product.id,
    agencyId: product.agencyId,
    name: product.name,
    description: product.description,
    type: product.type,
    frequency: product.frequency,
    basePrice: Number(product.basePrice.toString()),
    subscriptionMonthlyPrice: product.subscriptionMonthlyPrice ? Number(product.subscriptionMonthlyPrice.toString()) : null,
    subscriptionYearlyPrice: product.subscriptionYearlyPrice ? Number(product.subscriptionYearlyPrice.toString()) : null,
    isActive: product.isActive,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function toDayRateResponse(rate: {
  id: string;
  agencyId: string;
  productId: string;
  dayOfWeek: number | null;
  frequency: string | null;
  price: { toString: () => string };
  createdAt: Date;
  updatedAt: Date;
}): DayRateResponse {
  return {
    id: rate.id,
    agencyId: rate.agencyId,
    productId: rate.productId,
    dayOfWeek: rate.dayOfWeek,
    frequency: rate.frequency,
    price: Number(rate.price.toString()),
    createdAt: rate.createdAt,
    updatedAt: rate.updatedAt,
  };
}

export async function createProduct(
  dto: CreateProductDto,
  agencyId: string
): Promise<ProductResponse> {
  const product = await productRepository.createProduct({ ...dto, agencyId });
  return toProductResponse(product);
}

export async function getProduct(id: string, agencyId: string): Promise<ProductResponse> {
  const product = await productRepository.findProductById(id, agencyId);
  if (!product) {
    throw new NotFoundError('Product');
  }
  return toProductResponse(product);
}

export async function updateProduct(
  id: string,
  dto: UpdateProductDto,
  agencyId: string,
  userId?: string
): Promise<ProductResponse> {
  const product = await productRepository.findProductById(id, agencyId);
  if (!product) {
    throw new NotFoundError('Product');
  }

  const oldData = {
    name: product.name,
    basePrice: Number(product.basePrice),
    isActive: product.isActive,
  };
  const updated = await productRepository.updateProduct(id, agencyId, dto);

  logAudit({
    agencyId,
    userId,
    entityType: 'Product',
    entityId: id,
    action: 'PRODUCT_UPDATED',
    oldValue: oldData,
    newValue: {
      name: updated.name,
      basePrice: Number(updated.basePrice),
      isActive: updated.isActive,
    },
  });

  return toProductResponse(updated);
}

export async function activateProduct(
  id: string,
  agencyId: string,
  userId?: string
): Promise<ProductResponse> {
  const product = await productRepository.findProductById(id, agencyId);
  if (!product) {
    throw new NotFoundError('Product');
  }

  const updated = await productRepository.setProductActive(id, agencyId, true);

  logAudit({
    agencyId,
    userId,
    entityType: 'Product',
    entityId: id,
    action: 'PRODUCT_ACTIVATED',
    oldValue: { isActive: false },
    newValue: { isActive: true },
  });

  return toProductResponse(updated);
}

export async function deactivateProduct(
  id: string,
  agencyId: string,
  userId?: string
): Promise<ProductResponse> {
  const product = await productRepository.findProductById(id, agencyId);
  if (!product) {
    throw new NotFoundError('Product');
  }

  const updated = await productRepository.setProductActive(id, agencyId, false);

  logAudit({
    agencyId,
    userId,
    entityType: 'Product',
    entityId: id,
    action: 'PRODUCT_DEACTIVATED',
    oldValue: { isActive: true },
    newValue: { isActive: false },
  });

  return toProductResponse(updated);
}

export async function listProducts(agencyId: string): Promise<ProductResponse[]> {
  const products = await productRepository.listProducts(agencyId);
  return products.map(toProductResponse);
}

export async function createDayRate(
  productId: string,
  dto: CreateDayRateDto,
  agencyId: string
): Promise<DayRateResponse> {
  const product = await productRepository.findProductById(productId, agencyId);
  if (!product) {
    throw new NotFoundError('Product');
  }

  const existing = await productRepository.listDayRates(productId, agencyId);
  const dayOfWeek = dto.dayOfWeek ?? 0;
  const frequency = dto.frequency ?? 'DAILY';
  if (existing.some((r) => r.dayOfWeek === dayOfWeek && r.frequency === frequency)) {
    throw new ConflictError('Rate already exists for this day of week and frequency');
  }

  const rate = await productRepository.createDayRate({
    ...dto,
    agencyId,
    productId,
  });
  return toDayRateResponse(rate);
}

export async function upsertDayRate(
  productId: string,
  dto: CreateDayRateDto,
  agencyId: string
): Promise<DayRateResponse> {
  const product = await productRepository.findProductById(productId, agencyId);
  if (!product) {
    throw new NotFoundError('Product');
  }

  const dayOfWeek = dto.dayOfWeek ?? 0;
  const frequency = dto.frequency ?? 'DAILY';
  const rate = await productRepository.upsertDayRate(productId, agencyId, dayOfWeek, frequency, dto.price);
  return toDayRateResponse(rate);
}

export async function listDayRates(
  productId: string,
  agencyId: string
): Promise<DayRateResponse[]> {
  const product = await productRepository.findProductById(productId, agencyId);
  if (!product) {
    throw new NotFoundError('Product');
  }

  const rates = await productRepository.listDayRates(productId, agencyId);
  return rates.map(toDayRateResponse);
}

export async function updateDayRate(
  productId: string,
  rateId: string,
  dto: UpdateDayRateDto,
  agencyId: string
): Promise<DayRateResponse> {
  const product = await productRepository.findProductById(productId, agencyId);
  if (!product) {
    throw new NotFoundError('Product');
  }

  const rate = await productRepository.findDayRateById(rateId, agencyId);
  if (!rate) {
    throw new NotFoundError('DayRate');
  }

  const updated = await productRepository.updateDayRate(rateId, agencyId, dto);
  return toDayRateResponse(updated);
}

export async function deleteDayRate(
  productId: string,
  rateId: string,
  agencyId: string
): Promise<void> {
  const product = await productRepository.findProductById(productId, agencyId);
  if (!product) {
    throw new NotFoundError('Product');
  }

  const rate = await productRepository.findDayRateById(rateId, agencyId);
  if (!rate) {
    throw new NotFoundError('DayRate');
  }

  await productRepository.deleteDayRate(rateId, agencyId);
}
