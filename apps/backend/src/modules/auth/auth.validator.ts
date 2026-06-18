import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{9,14}$/)
      .optional(),
    password: z.string().min(6),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    firebaseUid: z.string().min(1),
    agencyId: z.string().uuid(),
  })
  .refine((data) => data.email ?? data.phone, { message: 'Either email or phone is required' });

export const loginSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    firebaseToken: z.string().min(1),
  })
  .refine((data) => data.email ?? data.phone, { message: 'Either email or phone is required' });

export const sendOtpSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/),
});

export const sendOtpEmailSchema = z.object({
  email: z.string().email(),
});

export const verifyOtpSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/),
  otp: z.string().length(6),
});

export const verifyEmailOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export const customerRegisterSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().optional(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
});
