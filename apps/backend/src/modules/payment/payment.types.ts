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

export type RecordPaymentDto = z.infer<typeof recordPaymentSchema>;
export type ProcessRefundDto = z.infer<typeof processRefundSchema>;
export type RetryPaymentDto = z.infer<typeof retryPaymentSchema>;
export type InitOnlinePaymentDto = z.infer<typeof initOnlinePaymentSchema>;
export type SaveGatewayConfigDto = z.infer<typeof saveGatewayConfigSchema>;

export interface PaymentResponse {
  id: string;
  agencyId: string;
  invoiceId: string;
  customerId: string;
  customerName?: string;
  invoiceNumber?: string;
  paymentNumber: string;
  amount: number;
  method: string;
  status: string;
  transactionReference: string | null;
  gatewayOrderId: string | null;
  gatewayPaymentId: string | null;
  failureReason: string | null;
  attemptCount: number;
  paidAt: string | null;
  createdAt: string;
}

export interface PaymentRefundResponse {
  id: string;
  paymentId: string;
  amount: number;
  reason: string | null;
  status: string;
  gatewayRefundId: string | null;
  processedAt: string | null;
  createdAt: string;
}

export interface PaymentGatewayConfigResponse {
  id: string;
  agencyId: string;
  provider: string;
  apiKey: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
