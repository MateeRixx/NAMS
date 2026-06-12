import { z } from 'zod';

export const createDeliveryZoneSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  monthlyCharge: z.number().min(0),
});

export const updateDeliveryZoneSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  monthlyCharge: z.number().min(0).optional(),
});
