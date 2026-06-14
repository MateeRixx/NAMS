import prisma from '@newsflow/database';
import type {
  CreateProductDto,
  UpdateProductDto,
  CreateDayRateDto,
  UpdateDayRateDto,
} from './product.types.js';

export async function createProduct(data: CreateProductDto & { agencyId: string }) {
  const { dayRates, ...productData } = data;
  const prismaData: Record<string, unknown> = { ...productData };
  if (dayRates?.length) {
    prismaData['dayRates'] = {
      create: dayRates.map((r) => ({ ...r, agencyId: data.agencyId })),
    };
  }
  return prisma.product.create({ data: prismaData as never });
}

export async function findProductById(id: string, agencyId: string) {
  return prisma.product.findFirst({
    where: { id, agencyId },
  });
}

export async function updateProduct(id: string, _agencyId: string, data: UpdateProductDto) {
  return prisma.product.update({
    where: { id },
    data: data as never,
  });
}

export async function setProductActive(id: string, _agencyId: string, isActive: boolean) {
  return prisma.product.update({
    where: { id },
    data: { isActive },
  });
}

export async function listProducts(agencyId: string) {
  return prisma.product.findMany({
    where: { agencyId },
    orderBy: { name: 'asc' },
  });
}

export async function createDayRate(
  data: CreateDayRateDto & { agencyId: string; productId: string }
) {
  return prisma.productDayRate.create({ data: data as never });
}

export async function upsertDayRate(
  productId: string,
  agencyId: string,
  dayOfWeek: number,
  price: number
) {
  return prisma.productDayRate.upsert({
    where: { productId_dayOfWeek: { productId, dayOfWeek } },
    create: { productId, agencyId, dayOfWeek, price },
    update: { price },
  });
}

export async function findDayRateById(id: string, agencyId: string) {
  return prisma.productDayRate.findFirst({
    where: { id, agencyId },
  });
}

export async function listDayRates(productId: string, agencyId: string) {
  return prisma.productDayRate.findMany({
    where: { productId, agencyId },
    orderBy: { dayOfWeek: 'asc' },
  });
}

export async function updateDayRate(id: string, _agencyId: string, data: UpdateDayRateDto) {
  return prisma.productDayRate.update({
    where: { id },
    data,
  });
}

export async function deleteDayRate(id: string, _agencyId: string) {
  return prisma.productDayRate.delete({
    where: { id },
  });
}
