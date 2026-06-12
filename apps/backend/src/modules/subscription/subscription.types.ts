export interface CreateSubscriptionDto {
  customerId: string;
  productId: string;
  startDate?: string;
  endDate?: string;
}

export interface PauseSubscriptionDto {
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface SubscriptionResponse {
  id: string;
  agencyId: string;
  customerId: string;
  productId: string;
  startDate: Date;
  endDate: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPauseResponse {
  id: string;
  agencyId: string;
  subscriptionId: string;
  startDate: Date;
  endDate: Date;
  reason: string | null;
  createdAt: Date;
  updatedAt: Date;
}
