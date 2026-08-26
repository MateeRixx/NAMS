export interface DayRateInput {
  dayOfWeek?: number;
  frequency?: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY';
  price: number;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  type: 'NEWSPAPER' | 'MAGAZINE' | 'BUNDLE';
  frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY';
  basePrice: number;
  subscriptionMonthlyPrice?: number;
  subscriptionYearlyPrice?: number;
  isActive?: boolean;
  dayRates?: DayRateInput[];
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  type?: 'NEWSPAPER' | 'MAGAZINE' | 'BUNDLE';
  frequency?: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY';
  basePrice?: number;
  subscriptionMonthlyPrice?: number;
  subscriptionYearlyPrice?: number;
}

export interface ProductResponse {
  id: string;
  agencyId: string;
  name: string;
  description: string | null;
  type: string;
  frequency: string;
  basePrice: number;
  subscriptionMonthlyPrice: number | null;
  subscriptionYearlyPrice: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDayRateDto {
  dayOfWeek?: number;
  frequency?: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY';
  price: number;
}

export interface UpdateDayRateDto {
  price: number;
}

export interface DayRateResponse {
  id: string;
  agencyId: string;
  productId: string;
  dayOfWeek: number | null;
  frequency: string | null;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}
