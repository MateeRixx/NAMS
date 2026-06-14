import { NotFoundError } from '@newsflow/shared';
import * as billingChargeRepository from './billing-charge.repository.js';
import type {
  CreateBillingChargeDto,
  UpdateBillingChargeDto,
  BillingChargeResponse,
} from './billing-charge.types.js';

function toResponse(charge: {
  id: string;
  agencyId: string;
  name: string;
  description: string | null;
  amount: { toString: () => string };
  type: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): BillingChargeResponse {
  return {
    id: charge.id,
    agencyId: charge.agencyId,
    name: charge.name,
    description: charge.description,
    amount: Number(charge.amount.toString()),
    type: charge.type,
    isActive: charge.isActive,
    createdAt: charge.createdAt,
    updatedAt: charge.updatedAt,
  };
}

export async function createCharge(
  dto: CreateBillingChargeDto,
  agencyId: string
): Promise<BillingChargeResponse> {
  const charge = await billingChargeRepository.createCharge({ ...dto, agencyId });
  return toResponse(charge);
}

export async function getCharge(id: string, agencyId: string): Promise<BillingChargeResponse> {
  const charge = await billingChargeRepository.findChargeById(id, agencyId);
  if (!charge) {
    throw new NotFoundError('BillingCharge');
  }
  return toResponse(charge);
}

export async function updateCharge(
  id: string,
  dto: UpdateBillingChargeDto,
  agencyId: string
): Promise<BillingChargeResponse> {
  const charge = await billingChargeRepository.findChargeById(id, agencyId);
  if (!charge) {
    throw new NotFoundError('BillingCharge');
  }
  const updated = await billingChargeRepository.updateCharge(id, agencyId, dto);
  return toResponse(updated);
}

export async function listCharges(agencyId: string): Promise<BillingChargeResponse[]> {
  const charges = await billingChargeRepository.listCharges(agencyId);
  return charges.map(toResponse);
}

export async function deleteCharge(id: string, agencyId: string): Promise<void> {
  const charge = await billingChargeRepository.findChargeById(id, agencyId);
  if (!charge) {
    throw new NotFoundError('BillingCharge');
  }
  await billingChargeRepository.deleteCharge(id, agencyId);
}
