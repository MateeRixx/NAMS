import { NotFoundError, ValidationError } from '@newsflow/shared';
import * as complaintRepository from './complaint.repository.js';
import type {
  CreateComplaintDto,
  UpdateComplaintStatusDto,
  ComplaintResponse,
  ComplaintHistoryResponse,
} from './complaint.types.js';

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['IN_PROGRESS'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
};

function toComplaintResponse(c: {
  id: string;
  agencyId: string;
  customerId: string;
  subscriptionId: string | null;
  type: string;
  description: string | null;
  status: string;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ComplaintResponse {
  return {
    id: c.id,
    agencyId: c.agencyId,
    customerId: c.customerId,
    subscriptionId: c.subscriptionId,
    type: c.type,
    description: c.description,
    status: c.status,
    resolvedAt: c.resolvedAt,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

function toHistoryResponse(h: {
  id: string;
  agencyId: string;
  complaintId: string;
  action: string;
  notes: string | null;
  performedBy: string;
  createdAt: Date;
}): ComplaintHistoryResponse {
  return {
    id: h.id,
    agencyId: h.agencyId,
    complaintId: h.complaintId,
    action: h.action,
    notes: h.notes,
    performedBy: h.performedBy,
    createdAt: h.createdAt,
  };
}

export async function createComplaint(
  dto: CreateComplaintDto,
  agencyId: string,
  userId: string
): Promise<ComplaintResponse> {
  const customer = await complaintRepository.findCustomerById(dto.customerId, agencyId);
  if (!customer) {
    throw new NotFoundError('Customer');
  }

  if (dto.subscriptionId) {
    const sub = await complaintRepository.findSubscriptionById(dto.subscriptionId, agencyId);
    if (!sub) {
      throw new NotFoundError('Subscription');
    }
  }

  const complaint = await complaintRepository.createComplaint({ ...dto, agencyId });

  await complaintRepository.createHistoryEntry({
    complaintId: complaint.id,
    agencyId,
    action: 'CREATED',
    notes: dto.description,
    performedBy: userId,
  });

  return toComplaintResponse(complaint);
}

export async function getComplaint(
  id: string,
  agencyId: string
): Promise<ComplaintResponse & { history: ComplaintHistoryResponse[] }> {
  const complaint = await complaintRepository.findComplaintById(id, agencyId);
  if (!complaint) {
    throw new NotFoundError('Complaint');
  }

  return {
    ...toComplaintResponse(complaint),
    history: (complaint.history ?? []).map(toHistoryResponse),
  };
}

export async function updateComplaintStatus(
  id: string,
  dto: UpdateComplaintStatusDto,
  agencyId: string,
  userId: string
): Promise<ComplaintResponse> {
  const complaint = await complaintRepository.findComplaintById(id, agencyId);
  if (!complaint) {
    throw new NotFoundError('Complaint');
  }

  const allowedTransitions = VALID_TRANSITIONS[complaint.status] ?? [];
  if (!allowedTransitions.includes(dto.status)) {
    throw new ValidationError(
      `Cannot transition from ${complaint.status} to ${dto.status}. ` +
        `Allowed transitions: ${allowedTransitions.join(', ') || 'none'}`
    );
  }

  const updated = await complaintRepository.updateComplaintStatus(id, agencyId, dto);

  await complaintRepository.createHistoryEntry({
    complaintId: id,
    agencyId,
    action: `STATUS_CHANGED:${complaint.status}→${dto.status}`,
    notes: dto.notes,
    performedBy: userId,
  });

  return toComplaintResponse(updated);
}

export async function listComplaints(
  agencyId: string
): Promise<(ComplaintResponse & { history: ComplaintHistoryResponse[] })[]> {
  const complaints = await complaintRepository.listComplaints(agencyId);
  return complaints.map((c) => ({
    ...toComplaintResponse(c),
    history: (c.history ?? []).map(toHistoryResponse),
  }));
}

export async function getComplaintHistory(
  id: string,
  agencyId: string
): Promise<ComplaintHistoryResponse[]> {
  const complaint = await complaintRepository.findComplaintById(id, agencyId);
  if (!complaint) {
    throw new NotFoundError('Complaint');
  }

  return (complaint.history ?? []).map(toHistoryResponse);
}
