import prisma from '@newsflow/database';
import type { CreateAgencyDto, UpdateAgencyDto } from './agency.types.js';

export async function createAgency(data: CreateAgencyDto) {
  return prisma.agency.create({ data: data as never });
}

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

export async function listAgencies() {
  return prisma.agency.findMany({ orderBy: { createdAt: 'desc' } });
}
