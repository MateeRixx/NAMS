export interface DayRateInput {
  dayOfWeek: number;
  price: number;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  type: 'NEWSPAPER' | 'MAGAZINE' | 'BUNDLE';
  basePrice: number;
  isActive?: boolean;
  dayRates?: DayRateInput[];
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  type?: 'NEWSPAPER' | 'MAGAZINE' | 'BUNDLE';
  basePrice?: number;
}

export interface ProductResponse {
  id: string;
  agencyId: string;
  name: string;
  description: string | null;
  type: string;
  basePrice: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDayRateDto {
  dayOfWeek: number;
  price: number;
}

export interface UpdateDayRateDto {
  price: number;
}

export interface DayRateResponse {
  id: string;
  agencyId: string;
  productId: string;
  dayOfWeek: number;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}
