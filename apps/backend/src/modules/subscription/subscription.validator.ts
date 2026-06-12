import { z } from 'zod';

export const createSubscriptionSchema = z.object({
  customerId: z.string().uuid(),
  productId: z.string().uuid(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const pauseSubscriptionSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().max(500).optional(),
});
