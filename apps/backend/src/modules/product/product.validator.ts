import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  type: z.enum(['NEWSPAPER', 'MAGAZINE', 'BUNDLE']),
  basePrice: z.number().min(0),
  isActive: z.boolean().optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  type: z.enum(['NEWSPAPER', 'MAGAZINE', 'BUNDLE']).optional(),
  basePrice: z.number().min(0).optional(),
});

export const createDayRateSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  price: z.number().min(0),
});

export const updateDayRateSchema = z.object({
  price: z.number().min(0),
});
