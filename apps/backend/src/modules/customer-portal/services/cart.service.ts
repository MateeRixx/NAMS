import { NotFoundError, ConflictError, ValidationError } from '@newsflow/shared';
import prisma from '@newsflow/database';
import { createAndQueueNotification } from '../../../services/notification.service.js';
import * as billingRepository from '../../billing/billing.repository.js';
import { getNextPaymentNumber } from '../../payment/payment.repository.js';
import { logAudit } from '../../../services/audit.service.js';
import { calcProductCost } from './subscription.service.js';

const TAX_RATE = 0.18;

export async function estimateCart(
  customerId: string,
  agencyId: string,
  items: { productId: string; startDate?: string }[]
): Promise<{
  items: { productId: string; productName: string; billableDays: number; unitPrice: number; amount: number; startDate: string }[];
  subtotal: number;
  deliveryCharges: number;
  taxAmount: number;
  totalAmount: number;
}> {
  const customer = await prisma.customer.findFirst({ where: { id: customerId, agencyId, deletedAt: null } });
  if (!customer) throw new NotFoundError('Customer');

  if (!items.length) throw new ValidationError('Cart is empty');

  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await prisma.product.findMany({ where: { id: { in: productIds }, agencyId, isActive: true }, include: { dayRates: true } });
  if (products.length !== productIds.length) throw new NotFoundError('One or more products not found');

  const existingSubs = await prisma.subscription.findMany({
    where: { customerId, agencyId, productId: { in: productIds }, status: { in: ['ACTIVE', 'PAUSED'] } },
  });
  if (existingSubs.length) {
    throw new ConflictError(`Already subscribed to: ${existingSubs.map((s) => s.productId).join(', ')}`);
  }

  const now = new Date();
  const productMap = new Map(products.map((p) => [p.id, p]));
  const cartItems: { productId: string; productName: string; billableDays: number; unitPrice: number; amount: number; startDate: string }[] = [];
  let subtotal = 0;

  for (const item of items) {
    const product = productMap.get(item.productId)!;
    const startDate = item.startDate ? new Date(item.startDate) : now;
    const { billableDays, totalAmount } = calcProductCost(product, startDate);
    if (billableDays === 0) continue;
    const unitPrice = Math.round((totalAmount / billableDays) * 100) / 100;
    cartItems.push({
      productId: product.id,
      productName: product.name,
      billableDays,
      unitPrice,
      amount: totalAmount,
      startDate: startDate.toISOString(),
    });
    subtotal += totalAmount;
  }
  subtotal = Math.round(subtotal * 100) / 100;

  const address = await prisma.address.findFirst({ where: { customerId, agencyId, isPrimary: true }, include: { deliveryZone: true } });
  const deliveryCharges = address?.deliveryZone ? Math.round(Number(address.deliveryZone.monthlyCharge.toString()) * 100) / 100 : 0;

  const taxableAmount = subtotal + deliveryCharges;
  const taxAmount = Math.round(taxableAmount * TAX_RATE * 100) / 100;
  const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

  return { items: cartItems, subtotal, deliveryCharges, taxAmount, totalAmount };
}

export async function checkoutCart(
  customerId: string,
  agencyId: string,
  userId: string,
  items: { productId: string; startDate?: string }[],
  paymentInfo?: { method: 'CASH' | 'ONLINE'; transactionReference?: string }
): Promise<{
  subscriptions: { id: string; productId: string }[];
  invoice: { id: string; invoiceNumber: string; totalAmount: number } | null;
  payment: { id: string; amount: number } | null;
}> {
  const customer = await prisma.customer.findFirst({ where: { id: customerId, agencyId, deletedAt: null } });
  if (!customer) throw new NotFoundError('Customer');

  if (!items.length) throw new ValidationError('Cart is empty');

  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await prisma.product.findMany({ where: { id: { in: productIds }, agencyId, isActive: true }, include: { dayRates: true } });
  if (products.length !== productIds.length) throw new NotFoundError('One or more products not found');

  const existingSubs = await prisma.subscription.findMany({
    where: { customerId, agencyId, productId: { in: productIds }, status: { in: ['ACTIVE', 'PAUSED'] } },
  });
  if (existingSubs.length) {
    throw new ConflictError(`Already subscribed to: ${existingSubs.map((s) => s.productId).join(', ')}`);
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const productMap = new Map(products.map((p) => [p.id, p]));
  const invoiceItems: { productId: string | null; description: string; quantity: number; unitPrice: number; amount: number }[] = [];
  let subtotal = 0;

  for (const item of items) {
    const product = productMap.get(item.productId)!;
    const startDate = item.startDate ? new Date(item.startDate) : now;
    const { billableDays, totalAmount } = calcProductCost(product, startDate);
    if (billableDays === 0) continue;
    const unitPrice = totalAmount / billableDays;
    invoiceItems.push({
      productId: product.id,
      description: `${product.name} (${billableDays} days, pro-rated)`,
      quantity: billableDays,
      unitPrice: Math.round(unitPrice * 100) / 100,
      amount: totalAmount,
    });
    subtotal += totalAmount;
  }
  subtotal = Math.round(subtotal * 100) / 100;

  if (!invoiceItems.length) throw new ValidationError('No billable days in this period');

  const address = await prisma.address.findFirst({ where: { customerId, agencyId, isPrimary: true }, include: { deliveryZone: true } });
  const deliveryCharges = address?.deliveryZone ? Math.round(Number(address.deliveryZone.monthlyCharge.toString()) * 100) / 100 : 0;
  const taxableAmount = subtotal + deliveryCharges;
  const taxAmount = Math.round(taxableAmount * TAX_RATE * 100) / 100;
  const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

  const seq = await billingRepository.getNextInvoiceSequence(agencyId, month, year);
  const invoiceNumber = `INV-${year}${String(month).padStart(2, '0')}-${String(seq).padStart(4, '0')}`;
  const paymentNumber = paymentInfo ? await getNextPaymentNumber(agencyId) : null;

  const result = await prisma.$transaction(async (tx) => {
    const subs = [];
    for (const item of items) {
      const product = productMap.get(item.productId)!;
      const startDate = item.startDate ? new Date(item.startDate) : now;
      const sub = await tx.subscription.create({
        data: { agencyId, customerId, productId: product.id, startDate, status: 'ACTIVE' },
      });
      subs.push({ id: sub.id, productId: sub.productId });
    }

    const invoice = await tx.invoice.create({
      data: {
        agencyId, customerId, invoiceNumber,
        billingMonth: month, billingYear: year,
        subtotal, deliveryCharges, discountAmount: 0, taxAmount, previousBalance: 0, totalAmount,
        status: paymentInfo ? 'PAID' : 'PENDING',
        generatedAt: now,
      },
    });

    for (const invItem of invoiceItems) {
      await tx.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          productId: invItem.productId,
          description: invItem.description,
          quantity: invItem.quantity,
          unitPrice: invItem.unitPrice,
          amount: invItem.amount,
        },
      });
    }

    let payment = null;
    if (paymentInfo) {
      payment = await tx.payment.create({
        data: {
          agencyId, customerId, invoiceId: invoice.id,
          paymentNumber: paymentNumber!,
          amount: totalAmount,
          method: paymentInfo.method as never,
          status: 'PAID',
          transactionReference: paymentInfo.transactionReference ?? `cart_${invoiceNumber}`,
          paidAt: now,
          attemptCount: 1,
        },
      });
    }

    return { subs, invoice, payment };
  });

  logAudit({
    agencyId, userId, entityType: 'Subscription',
    entityId: result.subs.map((s) => s.id).join(','),
    action: 'CART_CHECKOUT',
    newValue: { subscriptions: result.subs.length, invoiceNumber, totalAmount, paid: !!paymentInfo },
  });

  if (customer.email) {
    const productNames = items.map((i) => productMap.get(i.productId)?.name).filter(Boolean).join(', ');
    createAndQueueNotification({
      agencyId, customerId,
      type: 'SUBSCRIPTION_CREATED',
      channel: 'EMAIL',
      title: 'Subscriptions Activated',
      message: `Your subscriptions (${productNames}) are now active. Invoice ${invoiceNumber} for \u20B9${totalAmount}.`,
      emailTo: customer.email,
      emailSubject: `Subscriptions Activated - ${invoiceNumber}`,
      templateData: {
        customerName: `${customer.firstName} ${customer.lastName}`,
        productName: productNames,
        invoiceNumber,
        totalAmount: String(totalAmount),
      },
    }).catch(() => {});
  }

  return {
    subscriptions: result.subs,
    invoice: result.invoice ? { id: result.invoice.id, invoiceNumber: result.invoice.invoiceNumber, totalAmount: Number(result.invoice.totalAmount.toString()) } : null,
    payment: result.payment ? { id: result.payment.id, amount: Number(result.payment.amount.toString()) } : null,
  };
}
