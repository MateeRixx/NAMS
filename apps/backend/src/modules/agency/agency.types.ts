export interface UpdateAgencyDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  logoUrl?: string;
  taxRate?: number;
}

export interface AgencyResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  gstNumber: string | null;
  logoUrl: string | null;
  taxRate: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateStatusDto {
  status: 'ACTIVE' | 'SUSPENDED';
}
