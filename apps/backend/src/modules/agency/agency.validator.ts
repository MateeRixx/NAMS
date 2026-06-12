import { z } from 'zod';

export const createAgencySchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/),
  address: z.string().max(500).optional(),
  gstNumber: z.string().max(50).optional(),
});

export const updateAgencySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{9,14}$/)
    .optional(),
  address: z.string().max(500).optional(),
  gstNumber: z.string().max(50).optional(),
  logoUrl: z.string().url().max(500).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']),
});
