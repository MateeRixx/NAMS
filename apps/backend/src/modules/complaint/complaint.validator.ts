import { z } from 'zod';

export const createComplaintSchema = z.object({
  customerId: z.string().uuid(),
  subscriptionId: z.string().uuid().optional(),
  type: z.enum(['MISSED_DELIVERY', 'DAMAGED_PAPER', 'WRONG_PRODUCT', 'LATE_DELIVERY', 'OTHER']),
  description: z.string().max(1000).optional(),
});

export const updateComplaintStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  notes: z.string().max(1000).optional(),
});
