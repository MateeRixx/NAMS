import { NotFoundError, ConflictError, ValidationError } from '@newsflow/shared';
import prisma from '@newsflow/database';
import { generateInvoice, getInvoicePdf } from '../../billing/billing.service.js';
import { getPaymentGateway } from '../../../services/payment-gateway.service.js';
import { getNextPaymentNumber } from '../../payment/payment.repository.js';
import { logAudit } from '../../../services/audit.service.js';
import { config } from '../../../config/index.js';
import { createAndQueueNotification } from '../../../services/notification.service.js';

interface InvoiceWithItems {
  id: string;
  invoiceNumber: string;
  billingMonth: number;
  billingYear: number;
  subtotal: number;
  deliveryCharges: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  generatedAt: Date;
}

export async function listInvoices(
  customerId: string,
  agencyId: string
): Promise<InvoiceWithItems[]> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, agencyId, deletedAt: null },
  });
  if (!customer) throw new NotFoundError('Customer');

  const invoices = await prisma.invoice.findMany({
    where: { customerId, agencyId },
    orderBy: { generatedAt: 'desc' },
  });

  return invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    billingMonth: inv.billingMonth,
    billingYear: inv.billingYear,
    subtotal: Number(inv.subtotal),
    deliveryCharges: Number(inv.deliveryCharges),
    discountAmount: Number(inv.discountAmount),
    taxAmount: Number(inv.taxAmount),
    totalAmount: Number(inv.totalAmount),
    status: inv.status,
    generatedAt: inv.generatedAt,
  }));
}

export async function generateCurrentInvoice(
  customerId: string,
  agencyId: string
): Promise<{ id: string; invoiceNumber: string; totalAmount: number; status: string }> {
  const now = new Date();
  const invoice = await generateInvoice(
    { customerId, billingMonth: now.getMonth() + 1, billingYear: now.getFullYear() },
    agencyId,
    customerId
  );
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    totalAmount: invoice.totalAmount,
    status: invoice.status,
  };
}

export async function getInvoice(
  invoiceId: string,
  customerId: string,
  agencyId: string
): Promise<
  InvoiceWithItems & {
    items: { description: string; quantity: number; unitPrice: number; amount: number }[];
  }
> {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, customerId, agencyId },
    include: { items: true },
  });
  if (!invoice) throw new NotFoundError('Invoice');

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    billingMonth: invoice.billingMonth,
    billingYear: invoice.billingYear,
    subtotal: Number(invoice.subtotal),
    deliveryCharges: Number(invoice.deliveryCharges),
    discountAmount: Number(invoice.discountAmount),
    taxAmount: Number(invoice.taxAmount),
    totalAmount: Number(invoice.totalAmount),
    status: invoice.status,
    generatedAt: invoice.generatedAt,
    items: invoice.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      amount: Number(item.amount),
    })),
  };
}

export async function downloadInvoicePdf(
  invoiceId: string,
  customerId: string,
  agencyId: string
): Promise<Buffer> {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, customerId, agencyId },
  });
  if (!invoice) throw new NotFoundError('Invoice');

  return getInvoicePdf(invoiceId, agencyId);
}

export async function initInvoicePayment(
  customerId: string,
  agencyId: string,
  invoiceId: string
): Promise<{ orderId: string; amount: number; currency: string; keyId: string | undefined; invoiceNumber: string }> {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, customerId, agencyId },
  });
  if (!invoice) throw new NotFoundError('Invoice');
  if (invoice.status === 'PAID') throw new ConflictError('Invoice is already paid');

  const gateway = getPaymentGateway();
  const order = await gateway.createOrder({
    amount: Number(invoice.totalAmount.toString()),
    currency: 'INR',
    receipt: `inv_${invoice.invoiceNumber}`,
    notes: { agencyId, invoiceId, customerId },
  });

  return {
    orderId: order.orderId,
    amount: order.amount,
    currency: order.currency,
    keyId: config.PAYMENT_KEY_ID,
    invoiceNumber: invoice.invoiceNumber,
  };
}

export async function verifyInvoicePayment(
  customerId: string,
  agencyId: string,
  data: { invoiceId: string; orderId: string; paymentId: string; signature: string }
): Promise<{ success: boolean; payment: { id: string; amount: number } }> {
  const invoice = await prisma.invoice.findFirst({
    where: { id: data.invoiceId, customerId, agencyId },
  });
  if (!invoice) throw new NotFoundError('Invoice');
  if (invoice.status === 'PAID') throw new ConflictError('Invoice is already paid');

  const gateway = getPaymentGateway();
  const isValid = gateway.verifyPayment({
    orderId: data.orderId,
    paymentId: data.paymentId,
    signature: data.signature,
  });

  if (!isValid) {
    throw new ValidationError('Payment verification failed');
  }

  const now = new Date();
  const seq = await getNextPaymentNumber(agencyId);
  const amount = Number(invoice.totalAmount.toString());

  const [payment] = await prisma.$transaction([
    prisma.payment.create({
      data: {
        agencyId, customerId, invoiceId: invoice.id,
        paymentNumber: seq,
        amount,
        method: 'ONLINE',
        status: 'PAID',
        transactionReference: data.paymentId,
        gatewayOrderId: data.orderId,
        gatewayPaymentId: data.paymentId,
        paidAt: now,
        attemptCount: 1,
      },
    }),
    prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: 'PAID' },
    }),
  ]);

  logAudit({
    agencyId,
    userId: customerId,
    entityType: 'Payment',
    entityId: payment.id,
    action: 'ONLINE_PAYMENT_VERIFIED',
    newValue: { invoiceId: invoice.id, amount, paymentId: data.paymentId },
  });

  const customer = await prisma.customer.findFirst({ where: { id: customerId } });
  if (customer?.email) {
    createAndQueueNotification({
      agencyId, customerId,
      type: 'PAYMENT_RECEIVED',
      channel: 'EMAIL',
      title: 'Payment Received',
      message: `Payment of \u20B9${amount} for invoice ${invoice.invoiceNumber} received successfully.`,
      emailTo: customer.email,
      emailSubject: `Payment Received - ${invoice.invoiceNumber}`,
      templateData: {
        customerName: `${customer.firstName} ${customer.lastName}`,
        invoiceNumber: invoice.invoiceNumber,
        amount: String(amount),
      },
    }).catch(() => {});
  }

  return {
    success: true,
    payment: { id: payment.id, amount: Number(payment.amount.toString()) },
  };
}
