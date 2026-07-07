import { z } from 'zod';

export const createCustomerSchema = z.object({
  customerCode: z.string().max(50).optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/),
  email: z.string().email().max(200).optional(),
});

export const updateCustomerSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{9,14}$/)
    .optional(),
  email: z.string().email().max(200).optional(),
});

export const customerQuerySchema = z.object({
  search: z.string().max(200).optional(),
  status: z.string().max(50).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const createAddressSchema = z.object({
  zoneId: z.string().uuid().optional(),
  houseNumber: z.string().min(1).max(50),
  street: z.string().min(1).max(200),
  floor: z.string().max(20).optional(),
  landmark: z.string().max(200).optional(),
  area: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  postalCode: z.string().min(1).max(20),
  isPrimary: z.boolean().optional(),
});

export const updateAddressSchema = z.object({
  zoneId: z.string().uuid().optional(),
  houseNumber: z.string().min(1).max(50).optional(),
  street: z.string().min(1).max(200).optional(),
  floor: z.string().max(20).optional(),
  landmark: z.string().max(200).optional(),
  area: z.string().min(1).max(200).optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().min(1).max(100).optional(),
  postalCode: z.string().min(1).max(20).optional(),
  isPrimary: z.boolean().optional(),
});
