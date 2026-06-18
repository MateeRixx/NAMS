import { z } from 'zod';

export const recordPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(['CASH', 'ONLINE']),
  transactionReference: z.string().optional(),
  gatewayOrderId: z.string().optional(),
  gatewayPaymentId: z.string().optional(),
});

export const processRefundSchema = z.object({
  paymentId: z.string().uuid(),
  amount: z.number().positive(),
  reason: z.string().optional(),
});

export const retryPaymentSchema = z.object({
  paymentId: z.string().uuid(),
});

export const initOnlinePaymentSchema = z.object({
  invoiceId: z.string().uuid(),
});

export const saveGatewayConfigSchema = z.object({
  provider: z.enum(['RAZORPAY', 'MOCK']),
  apiKey: z.string().min(1),
  apiSecret: z.string().min(1),
  webhookSecret: z.string().optional(),
});
