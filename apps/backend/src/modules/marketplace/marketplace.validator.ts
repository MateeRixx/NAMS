import { z } from 'zod';

export const createDistributionRequestSchema = z.object({
  customerId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  requestedQuantity: z.number().int().positive(),
  deliveryAddressId: z.string().uuid().optional(),
  contactPerson: z.string().max(100).optional(),
  contactPhone: z.string().max(20).optional(),
  scheduledDate: z.string().datetime().optional(),
  zones: z
    .array(
      z.object({
        deliveryZoneId: z.string().uuid(),
        quantity: z.number().int().positive(),
      })
    )
    .optional(),
});

export const updateDistributionRequestSchema = z.object({
  quotedPrice: z.number().nonnegative().optional(),
  status: z.enum(['QUOTED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});

export const createArticleRequestSchema = z.object({
  customerId: z.string().uuid(),
  productId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  publishInDate: z.string().datetime().optional(),
});

export const updateArticleRequestSchema = z.object({
  status: z.enum(['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED']).optional(),
  reviewNotes: z.string().max(2000).optional(),
});
