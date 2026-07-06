import prisma from '@newsflow/database';
import type { UpdateComplaintStatusDto } from './complaint.types.js';

export async function getNextComplaintNumber(agencyId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.complaint.count({
    where: { agencyId, createdAt: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) } },
  });
  return `COMP-${year}-${String(count + 1).padStart(4, '0')}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createComplaint(data: any) {
  return prisma.complaint.create({ data });
}

export async function findComplaintById(id: string, agencyId: string) {
  return prisma.complaint.findFirst({
    where: { id, agencyId },
    include: { history: { orderBy: { createdAt: 'asc' } }, customer: true },
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
    include: { history: { orderBy: { createdAt: 'asc' } }, customer: true },
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
