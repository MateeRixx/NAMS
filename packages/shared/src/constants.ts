export const API_PREFIX = '/api/v1';
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const BILLING_DAYS_IN_MONTH = 30;
export const COMPLAINT_PENALTY_THRESHOLD = 3;
export const COMPLAINT_PENALTY_PERCENTAGE = 15;

export const INVOICE_NUMBER_FORMAT = 'INV-YYYY-MM-XXXX';

export const DAYS_OF_WEEK = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
] as const;

export const ROLES_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 100,
  AGENCY_ADMIN: 50,
  AGENCY_STAFF: 30,
  CUSTOMER: 10,
};
