import prisma from '@newsflow/database';
import type { CreateDeliveryZoneDto, UpdateDeliveryZoneDto } from './delivery-zone.types.js';

export async function createDeliveryZone(data: CreateDeliveryZoneDto & { agencyId: string }) {
  return prisma.deliveryZone.create({
    data: {
      name: data.name,
      description: data.description,
      monthlyCharge: data.monthlyCharge ?? 0,
      perDeliveryCharge: data.perDeliveryCharge ?? 0,
      agencyId: data.agencyId,
    },
  });
}

export async function findDeliveryZoneById(id: string, agencyId: string) {
  return prisma.deliveryZone.findFirst({
    where: { id, agencyId },
  });
}

export async function updateDeliveryZone(
  id: string,
  agencyId: string,
  data: UpdateDeliveryZoneDto
) {
  return prisma.deliveryZone.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.monthlyCharge !== undefined && { monthlyCharge: data.monthlyCharge }),
      ...(data.perDeliveryCharge !== undefined && { perDeliveryCharge: data.perDeliveryCharge }),
    },
  });
}

export async function listDeliveryZones(agencyId: string) {
  return prisma.deliveryZone.findMany({
    where: { agencyId },
    orderBy: { name: 'asc' },
  });
}

export async function deleteDeliveryZone(id: string, agencyId: string) {
  return prisma.deliveryZone.delete({
    where: { id },
  });
}
