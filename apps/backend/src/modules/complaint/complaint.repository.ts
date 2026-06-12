import prisma from '@newsflow/database';
import type { CreateComplaintDto, UpdateComplaintStatusDto } from './complaint.types.js';

export async function createComplaint(data: CreateComplaintDto & { agencyId: string }) {
  return prisma.complaint.create({ data: data as never });
}

export async function findComplaintById(id: string, agencyId: string) {
  return prisma.complaint.findFirst({
    where: { id, agencyId },
    include: { history: { orderBy: { createdAt: 'asc' } } },
  });
}

export async function updateComplaintStatus(
  id: string,
  _agencyId: string,
  dto: UpdateComplaintStatusDto
) {
  const updateData: Record<string, unknown> = { status: dto.status };
  if (dto.status === 'RESOLVED' || dto.status === 'CLOSED') {
    updateData['resolvedAt'] = new Date();
  }

  return prisma.complaint.update({
    where: { id },
    data: updateData as never,
  });
}

export async function listComplaints(agencyId: string) {
  return prisma.complaint.findMany({
    where: { agencyId },
    orderBy: { createdAt: 'desc' },
    include: { history: { orderBy: { createdAt: 'asc' } } },
  });
}

export async function createHistoryEntry(data: {
  complaintId: string;
  agencyId: string;
  action: string;
  notes?: string;
  performedBy: string;
}) {
  return prisma.complaintHistory.create({ data: data as never });
}

export async function findCustomerById(id: string, agencyId: string) {
  return prisma.customer.findFirst({
    where: { id, agencyId, deletedAt: null },
  });
}

export async function findSubscriptionById(id: string, agencyId: string) {
  return prisma.subscription.findFirst({
    where: { id, agencyId },
  });
}
