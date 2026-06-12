import { z } from 'zod';

export const generateInvoiceSchema = z.object({
  customerId: z.string().uuid(),
  billingMonth: z.number().int().min(1).max(12),
  billingYear: z.number().int().min(2020).max(2100),
});
