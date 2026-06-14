import { ConflictError, NotFoundError } from '@newsflow/shared';
import * as agencyRepository from './agency.repository.js';
import type { UpdateAgencyDto, AgencyResponse, UpdateStatusDto } from './agency.types.js';

function toResponse(agency: {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  gstNumber: string | null;
  logoUrl: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): AgencyResponse {
  return {
    id: agency.id,
    name: agency.name,
    email: agency.email,
    phone: agency.phone,
    address: agency.address,
    gstNumber: agency.gstNumber,
    logoUrl: agency.logoUrl,
    status: agency.status,
    createdAt: agency.createdAt,
    updatedAt: agency.updatedAt,
  };
}

export async function getAgency(id: string): Promise<AgencyResponse> {
  const agency = await agencyRepository.findAgencyById(id);
  if (!agency) {
    throw new NotFoundError('Agency');
  }
  return toResponse(agency);
}

export async function updateAgency(id: string, dto: UpdateAgencyDto): Promise<AgencyResponse> {
  const agency = await agencyRepository.findAgencyById(id);
  if (!agency) {
    throw new NotFoundError('Agency');
  }

  if (dto.email && dto.email !== agency.email) {
    const existingEmail = await agencyRepository.findAgencyByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictError('Agency with this email already exists');
    }
  }

  const updated = await agencyRepository.updateAgency(id, dto);
  return toResponse(updated);
}

export async function updateAgencyStatus(
  id: string,
  dto: UpdateStatusDto
): Promise<AgencyResponse> {
  const agency = await agencyRepository.findAgencyById(id);
  if (!agency) {
    throw new NotFoundError('Agency');
  }

  const updated = await agencyRepository.updateAgencyStatus(id, dto.status);
  return toResponse(updated);
}
