import prisma from '@newsflow/database';
import type { CreateBillingChargeDto, UpdateBillingChargeDto } from './billing-charge.types.js';

export async function createCharge(data: CreateBillingChargeDto & { agencyId: string }) {
  return prisma.billingCharge.create({ data: data as never });
}

export async function findChargeById(id: string, agencyId: string) {
  return prisma.billingCharge.findFirst({
    where: { id, agencyId },
  });
}

export async function updateCharge(id: string, _agencyId: string, data: UpdateBillingChargeDto) {
  return prisma.billingCharge.update({
    where: { id },
    data: data as never,
  });
}

export async function listCharges(agencyId: string) {
  return prisma.billingCharge.findMany({
    where: { agencyId },
    orderBy: { name: 'asc' },
  });
}

export async function listActiveCharges(agencyId: string) {
  return prisma.billingCharge.findMany({
    where: { agencyId, isActive: true },
    orderBy: { name: 'asc' },
  });
}

export async function deleteCharge(id: string, _agencyId: string) {
  return prisma.billingCharge.delete({
    where: { id },
  });
}
