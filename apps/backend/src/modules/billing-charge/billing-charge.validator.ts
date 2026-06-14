import { z } from 'zod';

export const createBillingChargeSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  amount: z.number().min(0),
  type: z.enum(['FIXED', 'PERCENTAGE']),
  isActive: z.boolean().optional(),
});

export const updateBillingChargeSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  amount: z.number().min(0).optional(),
  type: z.enum(['FIXED', 'PERCENTAGE']).optional(),
  isActive: z.boolean().optional(),
});
