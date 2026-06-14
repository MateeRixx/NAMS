import prisma from '@newsflow/database';
import type { UpdateAgencyDto } from './agency.types.js';

export async function findAgencyById(id: string) {
  return prisma.agency.findUnique({ where: { id } });
}

export async function findAgencyByEmail(email: string) {
  return prisma.agency.findUnique({ where: { email } });
}

export async function updateAgency(id: string, data: UpdateAgencyDto) {
  return prisma.agency.update({ where: { id }, data: data as never });
}

export async function updateAgencyStatus(id: string, status: string) {
  return prisma.agency.update({ where: { id }, data: { status } });
}
