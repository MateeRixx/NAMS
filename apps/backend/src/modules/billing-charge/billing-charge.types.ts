export interface CreateBillingChargeDto {
  name: string;
  description?: string;
  amount: number;
  type: 'FIXED' | 'PERCENTAGE';
  isActive?: boolean;
}

export interface UpdateBillingChargeDto {
  name?: string;
  description?: string;
  amount?: number;
  type?: 'FIXED' | 'PERCENTAGE';
  isActive?: boolean;
}

export interface BillingChargeResponse {
  id: string;
  agencyId: string;
  name: string;
  description: string | null;
  amount: number;
  type: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
