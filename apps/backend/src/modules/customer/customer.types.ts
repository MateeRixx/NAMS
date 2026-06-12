export interface CreateCustomerDto {
  customerCode?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
}

export interface UpdateCustomerDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
}

export interface CustomerResponse {
  id: string;
  agencyId: string;
  customerCode: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerQueryParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateAddressDto {
  zoneId?: string;
  houseNumber: string;
  street: string;
  landmark?: string;
  area: string;
  city: string;
  state: string;
  postalCode: string;
  isPrimary?: boolean;
}

export interface UpdateAddressDto {
  zoneId?: string;
  houseNumber?: string;
  street?: string;
  landmark?: string;
  area?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  isPrimary?: boolean;
}

export interface AddressResponse {
  id: string;
  agencyId: string;
  customerId: string;
  zoneId: string | null;
  houseNumber: string;
  street: string;
  landmark: string | null;
  area: string;
  city: string;
  state: string;
  postalCode: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}
