import { NotFoundError, ConflictError, ValidationError } from '@newsflow/shared';
import * as paymentRepository from './payment.repository.js';
import { logAudit } from '../../services/audit.service.js';
import { createAndQueueNotification } from '../../services/notification.service.js';
import { getPaymentGateway } from '../../services/payment-gateway.service.js';
import { config } from '../../config/index.js';
import type { RecordPaymentDto, ProcessRefundDto, InitOnlinePaymentDto, SaveGatewayConfigDto, PaymentResponse, PaymentRefundResponse, PaymentGatewayConfigResponse } from './payment.types.js';

const MAX_RETRY_ATTEMPTS = 3;

function toPaymentResponse(p: {
  id: string;
  agencyId: string;
  invoiceId: string;
  customerId: string;
  paymentNumber: string;
  amount: { toString: () => string };
  method: string;
  status: string;
  transactionReference: string | null;
  gatewayOrderId: string | null;
  gatewayPaymentId: string | null;
  failureReason: string | null;
  attemptCount: number;
  paidAt: Date | null;
  createdAt: Date;
  invoice?: { invoiceNumber: string } | null;
  customer?: { firstName: string; lastName: string } | null;
}): PaymentResponse {
  return {
    id: p.id,
    agencyId: p.agencyId,
    invoiceId: p.invoiceId,
    customerId: p.customerId,
    customerName: p.customer ? `${p.customer.firstName} ${p.customer.lastName}` : undefined,
    invoiceNumber: p.invoice?.invoiceNumber,
    paymentNumber: p.paymentNumber,
    amount: Number(p.amount.toString()),
    method: p.method,
    status: p.status,
    transactionReference: p.transactionReference,
    gatewayOrderId: p.gatewayOrderId,
    gatewayPaymentId: p.gatewayPaymentId,
    failureReason: p.failureReason,
    attemptCount: p.attemptCount,
    paidAt: p.paidAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
  };
}

function toRefundResponse(r: {
  id: string;
  paymentId: string;
  amount: { toString: () => string };
  reason: string | null;
  status: string;
  gatewayRefundId: string | null;
  processedAt: Date | null;
  createdAt: Date;
}): PaymentRefundResponse {
  return {
    id: r.id,
    paymentId: r.paymentId,
    amount: Number(r.amount.toString()),
    reason: r.reason,
    status: r.status,
    gatewayRefundId: r.gatewayRefundId,
    processedAt: r.processedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function recordPayment(
  agencyId: string,
  userId: string | undefined,
  dto: RecordPaymentDto
): Promise<PaymentResponse> {
  const invoice = await paymentRepository.findInvoiceById(dto.invoiceId, agencyId);
  if (!invoice) {
    throw new NotFoundError('Invoice');
  }

  if (invoice.status === 'PAID') {
    throw new ConflictError('Invoice is already paid');
  }

  if (dto.amount > Number(invoice.totalAmount.toString())) {
    throw new ValidationError('Payment amount exceeds invoice total');
  }

  const paymentNumber = await paymentRepository.getNextPaymentNumber(agencyId);
  const payment = await paymentRepository.createPayment({
    agencyId,
    invoiceId: dto.invoiceId,
    customerId: invoice.customerId,
    paymentNumber,
    amount: dto.amount,
    method: dto.method,
    transactionReference: dto.transactionReference,
    gatewayOrderId: dto.gatewayOrderId,
    gatewayPaymentId: dto.gatewayPaymentId,
  });

  const totalPaid = await sumPaymentsForInvoice(dto.invoiceId, agencyId);
  if (totalPaid >= Number(invoice.totalAmount.toString())) {
    await paymentRepository.updateInvoiceStatus(dto.invoiceId, agencyId, 'PAID');
  }

  logAudit({
    agencyId,
    userId,
    entityType: 'Payment',
    entityId: payment.id,
    action: 'PAYMENT_RECORDED',
    newValue: { invoiceId: dto.invoiceId, amount: dto.amount, method: dto.method },
  });

  if (invoice.customer?.email) {
    const customerName = `${invoice.customer.firstName} ${invoice.customer.lastName}`;
    createAndQueueNotification({
      agencyId,
      customerId: invoice.customerId,
      type: 'PAYMENT_RECEIVED',
      channel: 'EMAIL',
      title: 'Payment Received',
      message: `Payment of ₹${dto.amount} received for invoice ${invoice.invoiceNumber}.`,
      emailTo: invoice.customer.email,
      emailSubject: `Payment Received - ${invoice.invoiceNumber}`,
      templateData: {
        customerName,
        invoiceNumber: invoice.invoiceNumber,
        amount: String(dto.amount),
      },
    }).catch((err) => console.error('[PaymentService] Failed to queue notification:', err));
  }

  return toPaymentResponse(payment);
}

export async function initOnlinePayment(
  agencyId: string,
  userId: string | undefined,
  dto: InitOnlinePaymentDto
) {
  const invoice = await paymentRepository.findInvoiceById(dto.invoiceId, agencyId);
  if (!invoice) {
    throw new NotFoundError('Invoice');
  }

  if (invoice.status === 'PAID') {
    throw new ConflictError('Invoice is already paid');
  }

  const gateway = getPaymentGateway();
  const order = await gateway.createOrder({
    amount: Number(invoice.totalAmount.toString()),
    currency: 'INR',
    receipt: `inv_${invoice.invoiceNumber}`,
    notes: { agencyId, invoiceId: dto.invoiceId },
  });

  logAudit({
    agencyId,
    userId,
    entityType: 'Payment',
    entityId: `order_${order.orderId}`,
    action: 'ONLINE_PAYMENT_INITIATED',
    newValue: { invoiceId: dto.invoiceId, amount: Number(invoice.totalAmount.toString()), orderId: order.orderId },
  });

  return {
    orderId: order.orderId,
    amount: order.amount,
    currency: order.currency,
    keyId: config.PAYMENT_KEY_ID,
    invoiceNumber: invoice.invoiceNumber,
  };
}

export async function verifyOnlinePayment(
  agencyId: string,
  data: { orderId: string; paymentId: string; signature: string; invoiceId: string }
): Promise<{ success: boolean; payment?: PaymentResponse }> {
  const gateway = getPaymentGateway();
  const isValid = gateway.verifyPayment({
    orderId: data.orderId,
    paymentId: data.paymentId,
    signature: data.signature,
  });

  if (!isValid) {
    throw new ValidationError('Payment verification failed - invalid signature');
  }

  const invoice = await paymentRepository.findInvoiceById(data.invoiceId, agencyId);
  if (!invoice) {
    throw new NotFoundError('Invoice');
  }

  const existingPayment = await paymentRepository.findPaymentsByInvoiceId(data.invoiceId, agencyId);
  const alreadyPaid = existingPayment.some((p) => p.status === 'PAID');
  if (alreadyPaid) {
    return { success: true };
  }

  const paymentNumber = await paymentRepository.getNextPaymentNumber(agencyId);
  const payment = await paymentRepository.createPayment({
    agencyId,
    invoiceId: data.invoiceId,
    customerId: invoice.customerId,
    paymentNumber,
    amount: Number(invoice.totalAmount.toString()),
    method: 'ONLINE',
    transactionReference: data.paymentId,
    gatewayOrderId: data.orderId,
    gatewayPaymentId: data.paymentId,
  });

  await paymentRepository.updateInvoiceStatus(data.invoiceId, agencyId, 'PAID');

  logAudit({
    agencyId,
    userId: undefined,
    entityType: 'Payment',
    entityId: payment.id,
    action: 'ONLINE_PAYMENT_VERIFIED',
    newValue: { invoiceId: data.invoiceId, paymentId: data.paymentId, orderId: data.orderId },
  });

  if (invoice.customer?.email) {
    createAndQueueNotification({
      agencyId,
      customerId: invoice.customerId,
      type: 'PAYMENT_RECEIVED',
      channel: 'EMAIL',
      title: 'Payment Successful',
      message: `Your payment of ₹${Number(invoice.totalAmount.toString())} for invoice ${invoice.invoiceNumber} was successful.`,
      emailTo: invoice.customer.email,
      emailSubject: `Payment Successful - ${invoice.invoiceNumber}`,
      templateData: {
        customerName: `${invoice.customer.firstName} ${invoice.customer.lastName}`,
        invoiceNumber: invoice.invoiceNumber,
        amount: String(invoice.totalAmount.toString()),
      },
    }).catch((err) => console.error('[PaymentService] Failed to queue notification:', err));
  }

  return { success: true, payment: toPaymentResponse(payment) };
}

export async function processRefund(
  agencyId: string,
  userId: string | undefined,
  dto: ProcessRefundDto
): Promise<PaymentRefundResponse> {
  const payment = await paymentRepository.findPaymentById(dto.paymentId, agencyId);
  if (!payment) {
    throw new NotFoundError('Payment');
  }

  if (payment.status !== 'PAID') {
    throw new ConflictError('Only paid payments can be refunded');
  }

  const totalRefunded = await sumRefundsForPayment(dto.paymentId, agencyId);
  const remaining = Number(payment.amount.toString()) - totalRefunded;
  if (dto.amount > remaining) {
    throw new ValidationError(`Refund amount exceeds remaining balance. Available: ₹${remaining}`);
  }

  const gateway = getPaymentGateway();
  let gatewayRefundId: string | undefined;

  if (payment.transactionReference) {
    try {
      const refund = await gateway.processRefund({
        paymentId: payment.transactionReference,
        amount: dto.amount,
      });
      gatewayRefundId = refund.refundId;
    } catch {
      console.error('[PaymentService] Gateway refund failed, recording as PENDING');
    }
  }

  const refund = await paymentRepository.createRefund({
    agencyId,
    paymentId: dto.paymentId,
    amount: dto.amount,
    reason: dto.reason,
    gatewayRefundId,
  });

  const isFullyRefunded = remaining - dto.amount <= 0;
  if (isFullyRefunded) {
    await paymentRepository.updatePaymentStatus(dto.paymentId, agencyId, { status: 'REFUNDED' });
    await paymentRepository.updateInvoiceStatus(payment.invoiceId, agencyId, 'GENERATED');
  }

  logAudit({
    agencyId,
    userId,
    entityType: 'PaymentRefund',
    entityId: refund.id,
    action: 'PAYMENT_REFUNDED',
    oldValue: { paymentId: dto.paymentId, amount: Number(payment.amount.toString()) },
    newValue: { refundAmount: dto.amount, reason: dto.reason, gatewayRefundId },
  });

  return toRefundResponse(refund);
}

export async function retryFailedPayment(
  agencyId: string,
  userId: string | undefined,
  paymentId: string
): Promise<{ message: string }> {
  const payment = await paymentRepository.findPaymentById(paymentId, agencyId);
  if (!payment) {
    throw new NotFoundError('Payment');
  }

  if (payment.status !== 'FAILED') {
    throw new ConflictError('Only failed payments can be retried');
  }

  if (payment.attemptCount >= MAX_RETRY_ATTEMPTS) {
    await paymentRepository.updateInvoiceStatus(payment.invoiceId, agencyId, 'OVERDUE');
    throw new ConflictError(`Payment exceeded max retry attempts (${MAX_RETRY_ATTEMPTS}). Invoice marked as OVERDUE.`);
  }

  await paymentRepository.updatePaymentStatus(paymentId, agencyId, {
    status: 'PENDING',
    attemptCount: payment.attemptCount + 1,
    failureReason: null,
  });

  logAudit({
    agencyId,
    userId,
    entityType: 'Payment',
    entityId: paymentId,
    action: 'PAYMENT_RETRY_INITIATED',
    oldValue: { status: 'FAILED', failureReason: payment.failureReason },
    newValue: { status: 'PENDING', attemptCount: payment.attemptCount + 1 },
  });

  return { message: `Payment ${paymentId} reset to PENDING. Attempt ${payment.attemptCount + 1}/${MAX_RETRY_ATTEMPTS}` };
}

export async function handlePaymentFailure(
  agencyId: string,
  paymentId: string,
  failureReason: string
): Promise<void> {
  const payment = await paymentRepository.findPaymentById(paymentId, agencyId);
  if (!payment) return;

  const newAttemptCount = payment.attemptCount + 1;
  await paymentRepository.updatePaymentStatus(paymentId, agencyId, {
    status: 'FAILED',
    failureReason,
    attemptCount: newAttemptCount,
  });

  if (newAttemptCount >= MAX_RETRY_ATTEMPTS) {
    await paymentRepository.updateInvoiceStatus(payment.invoiceId, agencyId, 'OVERDUE');
  }

  logAudit({
    agencyId,
    userId: undefined,
    entityType: 'Payment',
    entityId: paymentId,
    action: 'PAYMENT_FAILED',
    oldValue: { status: 'PENDING' },
    newValue: { status: 'FAILED', failureReason, attemptCount: newAttemptCount },
  });
}

export async function retryAllFailedPayments(
  agencyId: string,
  userId: string | undefined
): Promise<{ retried: number }> {
  const failedPayments = await paymentRepository.findFailedPayments(agencyId);
  let retried = 0;

  for (const payment of failedPayments) {
    try {
      await paymentRepository.updatePaymentStatus(payment.id, agencyId, {
        status: 'PENDING',
        attemptCount: payment.attemptCount + 1,
        failureReason: null,
      });
      retried += 1;
    } catch (err) {
      console.error(`[PaymentService] Failed to retry payment ${payment.id}:`, err);
    }
  }

  logAudit({
    agencyId,
    userId,
    entityType: 'Payment',
    entityId: 'batch',
    action: 'BATCH_RETRY_FAILED_PAYMENTS',
    newValue: { retried, total: failedPayments.length },
  });

  return { retried };
}

export async function getPayment(id: string, agencyId: string): Promise<PaymentResponse> {
  const payment = await paymentRepository.findPaymentById(id, agencyId);
  if (!payment) {
    throw new NotFoundError('Payment');
  }
  return toPaymentResponse(payment);
}

export async function listPayments(
  agencyId: string,
  page = 1,
  pageSize = 20
): Promise<{ payments: PaymentResponse[]; total: number; page: number; pageSize: number }> {
  const { payments, total } = await paymentRepository.listPayments(agencyId, page, pageSize);
  return { payments: payments.map(toPaymentResponse), total, page, pageSize };
}

export async function getInvoicePayments(invoiceId: string, agencyId: string): Promise<PaymentResponse[]> {
  const payments = await paymentRepository.findPaymentsByInvoiceId(invoiceId, agencyId);
  return payments.map(toPaymentResponse);
}

export async function getRefund(id: string, agencyId: string): Promise<PaymentRefundResponse> {
  const refund = await paymentRepository.findRefundById(id, agencyId);
  if (!refund) {
    throw new NotFoundError('Refund');
  }
  return toRefundResponse(refund);
}

export async function listRefunds(
  agencyId: string,
  page = 1,
  pageSize = 20
): Promise<{ refunds: PaymentRefundResponse[]; total: number; page: number; pageSize: number }> {
  const { refunds, total } = await paymentRepository.listRefunds(agencyId, page, pageSize);
  return { refunds: refunds.map(toRefundResponse), total, page, pageSize };
}

export async function saveGatewayConfig(
  agencyId: string,
  userId: string,
  dto: SaveGatewayConfigDto
): Promise<PaymentGatewayConfigResponse> {
  const config = await paymentRepository.findOrCreateGatewayConfig(agencyId, {
    provider: dto.provider,
    apiKey: dto.apiKey,
    apiSecret: dto.apiSecret,
    webhookSecret: dto.webhookSecret,
  });

  logAudit({
    agencyId,
    userId,
    entityType: 'PaymentGatewayConfig',
    entityId: config.id,
    action: 'GATEWAY_CONFIG_UPDATED',
    oldValue: undefined,
    newValue: { provider: dto.provider },
  });

  return {
    id: config.id,
    agencyId: config.agencyId,
    provider: config.provider,
    apiKey: config.apiKey,
    isActive: config.isActive,
    createdAt: config.createdAt.toISOString(),
    updatedAt: config.updatedAt.toISOString(),
  };
}

export async function getGatewayConfig(agencyId: string): Promise<PaymentGatewayConfigResponse | null> {
  const config = await paymentRepository.findGatewayConfig(agencyId);
  if (!config) return null;
  return {
    id: config.id,
    agencyId: config.agencyId,
    provider: config.provider,
    apiKey: config.apiKey,
    isActive: config.isActive,
    createdAt: config.createdAt.toISOString(),
    updatedAt: config.updatedAt.toISOString(),
  };
}

async function sumPaymentsForInvoice(invoiceId: string, agencyId: string): Promise<number> {
  const payments = await paymentRepository.findPaymentsByInvoiceId(invoiceId, agencyId);
  return payments
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + Number(p.amount.toString()), 0);
}

async function sumRefundsForPayment(paymentId: string, agencyId: string): Promise<number> {
  const refunds = await paymentRepository.listRefunds(agencyId, 1, 1000);
  return refunds.refunds
    .filter((r) => r.paymentId === paymentId && r.status === 'PROCESSED')
    .reduce((sum, r) => sum + Number(r.amount.toString()), 0);
}
