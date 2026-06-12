import { NotFoundError } from '@newsflow/shared';
import * as deliveryZoneRepository from './delivery-zone.repository.js';
import type {
  CreateDeliveryZoneDto,
  UpdateDeliveryZoneDto,
  DeliveryZoneResponse,
} from './delivery-zone.types.js';

function toResponse(zone: {
  id: string;
  agencyId: string;
  name: string;
  description: string | null;
  monthlyCharge: { toString: () => string };
  createdAt: Date;
  updatedAt: Date;
}): DeliveryZoneResponse {
  return {
    id: zone.id,
    agencyId: zone.agencyId,
    name: zone.name,
    description: zone.description,
    monthlyCharge: Number(zone.monthlyCharge.toString()),
    createdAt: zone.createdAt,
    updatedAt: zone.updatedAt,
  };
}

export async function createDeliveryZone(
  dto: CreateDeliveryZoneDto,
  agencyId: string
): Promise<DeliveryZoneResponse> {
  const zone = await deliveryZoneRepository.createDeliveryZone({ ...dto, agencyId });
  return toResponse(zone);
}

export async function getDeliveryZone(id: string, agencyId: string): Promise<DeliveryZoneResponse> {
  const zone = await deliveryZoneRepository.findDeliveryZoneById(id, agencyId);
  if (!zone) {
    throw new NotFoundError('DeliveryZone');
  }
  return toResponse(zone);
}

export async function updateDeliveryZone(
  id: string,
  dto: UpdateDeliveryZoneDto,
  agencyId: string
): Promise<DeliveryZoneResponse> {
  const zone = await deliveryZoneRepository.findDeliveryZoneById(id, agencyId);
  if (!zone) {
    throw new NotFoundError('DeliveryZone');
  }

  const updated = await deliveryZoneRepository.updateDeliveryZone(id, agencyId, dto);
  return toResponse(updated);
}

export async function listDeliveryZones(agencyId: string): Promise<DeliveryZoneResponse[]> {
  const zones = await deliveryZoneRepository.listDeliveryZones(agencyId);
  return zones.map(toResponse);
}
