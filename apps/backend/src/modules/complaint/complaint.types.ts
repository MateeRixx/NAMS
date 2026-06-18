export interface CreateComplaintDto {
  customerId: string;
  subscriptionId?: string;
  type: 'MISSED_DELIVERY' | 'DAMAGED_PAPER' | 'WRONG_PRODUCT' | 'LATE_DELIVERY' | 'OTHER';
  description?: string;
  complaintDate?: string;
}

export interface UpdateComplaintStatusDto {
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  notes?: string;
}

export interface ComplaintResponse {
  id: string;
  agencyId: string;
  customerId: string;
  subscriptionId: string | null;
  complaintNumber: string;
  type: string;
  description: string | null;
  status: string;
  complaintDate: Date | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplaintHistoryResponse {
  id: string;
  agencyId: string;
  complaintId: string;
  action: string;
  notes: string | null;
  performedBy: string;
  createdAt: Date;
}
