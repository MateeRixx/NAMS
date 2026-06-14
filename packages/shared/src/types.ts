export enum UserRole {
  AGENCY_ADMIN = 'AGENCY_ADMIN',
  AGENCY_STAFF = 'AGENCY_STAFF',
  CUSTOMER = 'CUSTOMER',
}

export enum ProductType {
  NEWSPAPER = 'NEWSPAPER',
  MAGAZINE = 'MAGAZINE',
  BUNDLE = 'BUNDLE',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
}

export enum ComplaintStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum ComplaintType {
  MISSED_DELIVERY = 'MISSED_DELIVERY',
  DAMAGED_PAPER = 'DAMAGED_PAPER',
  WRONG_PRODUCT = 'WRONG_PRODUCT',
  LATE_DELIVERY = 'LATE_DELIVERY',
  OTHER = 'OTHER',
}

export enum InvoiceStatus {
  PENDING = 'PENDING',
  GENERATED = 'GENERATED',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  ONLINE = 'ONLINE',
  CASH = 'CASH',
}

export interface JwtPayload {
  userId: string;
  agencyId: string;
  role: UserRole;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}
