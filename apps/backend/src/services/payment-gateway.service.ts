import { config } from '../config/index.js';

export interface CreateOrderInput {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface CreateOrderOutput {
  orderId: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export interface VerifyPaymentInput {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface RefundInput {
  paymentId: string;
  amount: number;
  notes?: Record<string, string>;
}

export interface RefundOutput {
  refundId: string;
  paymentId: string;
  amount: number;
  status: string;
}

export interface PaymentGateway {
  createOrder(input: CreateOrderInput): Promise<CreateOrderOutput>;
  verifyPayment(input: VerifyPaymentInput): boolean;
  processRefund(input: RefundInput): Promise<RefundOutput>;
  verifyWebhook(rawBody: string, signature: string, secret: string): boolean;
}

class MockGateway implements PaymentGateway {
  async createOrder(input: CreateOrderInput): Promise<CreateOrderOutput> {
    return {
      orderId: `mock_order_${Date.now()}`,
      amount: input.amount,
      currency: input.currency,
      receipt: input.receipt,
      status: 'created',
    };
  }

  verifyPayment(_input: VerifyPaymentInput): boolean {
    return true;
  }

  async processRefund(input: RefundInput): Promise<RefundOutput> {
    return {
      refundId: `mock_refund_${Date.now()}`,
      paymentId: input.paymentId,
      amount: input.amount,
      status: 'processed',
    };
  }

  verifyWebhook(_rawBody: string, _signature: string, _secret: string): boolean {
    return true;
  }
}

class RazorpayGateway implements PaymentGateway {
  private keyId: string;
  private keySecret: string;
  private razorpayInstance: {
    orders: { create: (args: Record<string, unknown>) => Promise<Record<string, unknown>> };
    payments: { refund: (paymentId: string, args: Record<string, unknown>) => Promise<Record<string, unknown>> };
  } | null = null;

  constructor() {
    this.keyId = config.PAYMENT_KEY_ID ?? '';
    this.keySecret = config.PAYMENT_KEY_SECRET ?? '';
  }

  private async getClient() {
    if (!this.razorpayInstance) {
      const RazorpayMod = await import('razorpay');
      const Razorpay = RazorpayMod.default || RazorpayMod;
      this.razorpayInstance = new Razorpay({
        key_id: this.keyId,
        key_secret: this.keySecret,
      }) as never;
    }
    return this.razorpayInstance;
  }

  async createOrder(input: CreateOrderInput): Promise<CreateOrderOutput> {
    const client = await this.getClient();
    const order = await client.orders.create({
      amount: Math.round(input.amount * 100),
      currency: input.currency,
      receipt: input.receipt,
      notes: input.notes,
    }) as unknown as { id: string; amount: number; currency: string; receipt: string; status: string };
    return {
      orderId: order.id,
      amount: order.amount / 100,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
    };
  }

  verifyPayment(input: VerifyPaymentInput): boolean {
    const { createHmac } = require('crypto');
    const expectedSignature = createHmac('sha256', this.keySecret)
      .update(`${input.orderId}|${input.paymentId}`)
      .digest('hex');
    return expectedSignature === input.signature;
  }

  async processRefund(input: RefundInput): Promise<RefundOutput> {
    const client = await this.getClient();
    const refund = await client.payments.refund(input.paymentId, {
      amount: Math.round(input.amount * 100),
      notes: input.notes,
    }) as unknown as { id: string; payment_id: string; amount: number; status: string };
    return {
      refundId: refund.id,
      paymentId: refund.payment_id,
      amount: refund.amount / 100,
      status: refund.status,
    };
  }

  verifyWebhook(rawBody: string, signature: string, secret: string): boolean {
    const { createHmac } = require('crypto');
    const expectedSignature = createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    return expectedSignature === signature;
  }
}

let gatewayInstance: PaymentGateway | null = null;

export function getPaymentGateway(): PaymentGateway {
  if (!gatewayInstance) {
    switch (config.PAYMENT_PROVIDER) {
      case 'razorpay':
        gatewayInstance = new RazorpayGateway();
        break;
      case 'mock':
      default:
        gatewayInstance = new MockGateway();
        break;
    }
  }
  return gatewayInstance;
}
