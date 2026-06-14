export interface UpdateAgencyDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  logoUrl?: string;
}

export interface AgencyResponse {
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
}

export interface UpdateStatusDto {
  status: 'ACTIVE' | 'SUSPENDED';
}
