import { NotFoundError } from '@newsflow/shared';
import prisma from '@newsflow/database';
import { createAndQueueNotification } from '../../../services/notification.service.js';
import { generateCancellationInvoice } from '../../billing/billing.service.js';

interface DashboardData {
  activeSubscriptions: number;
  totalSubscriptions: number;
  pendingComplaints: number;
  unpaidInvoices: number;
  subscriptions: {
    id: string;
    productName: string;
    status: string;
    startDate: Date;
  }[];
  complaints: {
    id: string;
    type: string;
    status: string;
    createdAt: Date;
  }[];
  invoices: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    status: string;
    billingMonth: number;
    billingYear: number;
  }[];
}

interface SubscriptionWithProduct {
  id: string;
  productName: string;
  productType: string;
  startDate: Date;
  endDate: Date | null;
  status: string;
  pauses: {
    id: string;
    startDate: Date;
    endDate: Date;
    reason: string | null;
  }[];
}

export async function getDashboard(customerId: string, agencyId: string): Promise<DashboardData> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, agencyId, deletedAt: null },
  });
  if (!customer) throw new NotFoundError('Customer');

  const [subscriptions, complaints, invoices] = await Promise.all([
    prisma.subscription.findMany({
      where: { customerId, agencyId },
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.complaint.findMany({
      where: { customerId, agencyId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.invoice.findMany({
      where: { customerId, agencyId },
      orderBy: { generatedAt: 'desc' },
      take: 10,
    }),
  ]);

  return {
    activeSubscriptions: subscriptions.filter((s) => s.status === 'ACTIVE').length,
    totalSubscriptions: subscriptions.length,
    pendingComplaints: complaints.filter(
      (c) => c.status === 'PENDING' || c.status === 'IN_PROGRESS'
    ).length,
    unpaidInvoices: invoices.filter((inv) => inv.status === 'PENDING' || inv.status === 'OVERDUE')
      .length,
    subscriptions: subscriptions.map((s) => ({
      id: s.id,
      productName: s.product.name,
      status: s.status,
      startDate: s.startDate,
    })),
    complaints: complaints.map((c) => ({
      id: c.id,
      type: c.type,
      status: c.status,
      createdAt: c.createdAt,
    })),
    invoices: invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      totalAmount: Number(inv.totalAmount),
      status: inv.status,
      billingMonth: inv.billingMonth,
      billingYear: inv.billingYear,
    })),
  };
}

function computeMonthlyCost(product: { basePrice: { toString: () => string }; dayRates?: { dayOfWeek: number; price: { toString: () => string } }[] }): number {
  const basePrice = Number(product.basePrice.toString());
  const dayRateMap = new Map<number, number>();
  for (const r of product.dayRates ?? []) {
    dayRateMap.set(r.dayOfWeek, Number(r.price.toString()));
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  let total = 0;
  for (let d = 1; d <= daysInMonth(year, month); d++) {
    const current = new Date(year, month - 1, d);
    total += dayRateMap.get(current.getDay()) ?? basePrice;
  }
  return Math.round(total * 100) / 100;
}

export async function listProducts(
  agencyId: string
): Promise<
  { id: string; name: string; type: string; basePrice: number; description: string | null; estimatedMonthlyCost: number; dayRates: { dayOfWeek: number; price: number }[] }[]
> {
  const products = await prisma.product.findMany({
    where: { agencyId, isActive: true },
    orderBy: { name: 'asc' },
    include: { dayRates: true },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    basePrice: Number(p.basePrice),
    description: p.description,
    estimatedMonthlyCost: computeMonthlyCost(p),
    dayRates: p.dayRates.map((dr) => ({ dayOfWeek: dr.dayOfWeek, price: Number(dr.price) })),
  }));
}

export async function createSubscription(
  customerId: string,
  agencyId: string,
  data: { productId: string; startDate?: string }
): Promise<{ id: string; productId: string; status: string; startDate: Date }> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, agencyId, deletedAt: null },
  });
  if (!customer) throw new NotFoundError('Customer');

  const product = await prisma.product.findFirst({
    where: { id: data.productId, agencyId, isActive: true },
  });
  if (!product) throw new NotFoundError('Product');

  const existing = await prisma.subscription.findFirst({
    where: { customerId, productId: data.productId, status: { in: ['ACTIVE', 'PAUSED'] } },
  });
  if (existing) throw new Error('Already subscribed to this product');

  const startDate = data.startDate ? new Date(data.startDate) : new Date();

  const subscription = await prisma.subscription.create({
    data: {
      agencyId,
      customerId,
      productId: data.productId,
      startDate,
      status: 'ACTIVE',
    },
  });

  if (customer.email) {
    createAndQueueNotification({
      agencyId,
      customerId,
      type: 'SUBSCRIPTION_CREATED',
      channel: 'EMAIL',
      title: 'Subscription Started',
      message: `Your subscription to ${product.name} has been activated.`,
      emailTo: customer.email,
      emailSubject: `Subscription Started - ${product.name}`,
      templateData: {
        customerName: `${customer.firstName} ${customer.lastName}`,
        productName: product.name,
      },
    }).catch(() => {});
  }

  return {
    id: subscription.id,
    productId: subscription.productId,
    status: subscription.status,
    startDate: subscription.startDate,
  };
}

export async function listSubscriptions(
  customerId: string,
  agencyId: string
): Promise<SubscriptionWithProduct[]> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, agencyId, deletedAt: null },
  });
  if (!customer) throw new NotFoundError('Customer');

  const subscriptions = await prisma.subscription.findMany({
    where: { customerId, agencyId },
    include: {
      product: { select: { name: true, type: true, basePrice: true } },
      pauses: { orderBy: { startDate: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return subscriptions.map((s) => ({
    id: s.id,
    productName: s.product.name,
    productType: s.product.type,
    basePrice: Number(s.product.basePrice),
    startDate: s.startDate,
    endDate: s.endDate,
    status: s.status,
    pauses: s.pauses.map((p) => ({
      id: p.id,
      startDate: p.startDate,
      endDate: p.endDate,
      reason: p.reason,
    })),
  }));
}

export async function cancelSubscription(
  subscriptionId: string,
  customerId: string,
  agencyId: string
): Promise<{ id: string; status: string }> {
  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, customerId, agencyId },
  });
  if (!subscription) throw new NotFoundError('Subscription');
  if (subscription.status !== 'ACTIVE') throw new Error('Subscription is not active');

  const cancelDate = new Date();

  const invoice = await generateCancellationInvoice(customerId, agencyId, subscriptionId, cancelDate);
  if (invoice) {
    console.log(`[CustomerPortal] Final invoice ${invoice.invoiceNumber} generated`);
  }

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: 'CANCELLED', endDate: cancelDate },
  });

  const cust = await prisma.customer.findFirst({
    where: { id: customerId, agencyId, deletedAt: null },
  });
  if (cust?.email) {
    createAndQueueNotification({
      agencyId,
      customerId,
      type: 'SUBSCRIPTION_CANCELLED',
      channel: 'EMAIL',
      title: 'Subscription Cancelled',
      message: 'Your subscription has been cancelled.',
      emailTo: cust.email,
      emailSubject: 'Subscription Cancelled - NewsFlow',
      templateData: { customerName: `${cust.firstName} ${cust.lastName}` },
    }).catch(() => {});
  }

  return { id: updated.id, status: updated.status };
}

export async function pauseSubscription(
  subscriptionId: string,
  customerId: string,
  agencyId: string,
  data: { startDate: string; endDate: string; reason?: string }
): Promise<{ id: string; status: string }> {
  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, customerId, agencyId },
  });
  if (!subscription) throw new NotFoundError('Subscription');
  if (subscription.status !== 'ACTIVE') throw new Error('Subscription is not active');

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: 'PAUSED',
      pauses: {
        create: {
          agencyId,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          reason: data.reason ?? null,
        },
      },
    },
  });

  const cust = await prisma.customer.findFirst({
    where: { id: customerId, agencyId, deletedAt: null },
  });
  if (cust?.email) {
    createAndQueueNotification({
      agencyId,
      customerId,
      type: 'SUBSCRIPTION_PAUSED',
      channel: 'EMAIL',
      title: 'Subscription Paused',
      message: 'Your subscription has been paused.',
      emailTo: cust.email,
      emailSubject: 'Subscription Paused - NewsFlow',
      templateData: { customerName: `${cust.firstName} ${cust.lastName}` },
    }).catch(() => {});
  }

  return { id: updated.id, status: updated.status };
}

export async function resumeSubscription(
  subscriptionId: string,
  customerId: string,
  agencyId: string
): Promise<{ id: string; status: string }> {
  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, customerId, agencyId },
  });
  if (!subscription) throw new NotFoundError('Subscription');
  if (subscription.status !== 'PAUSED') throw new Error('Subscription is not paused');

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: 'ACTIVE' },
  });

  const cust = await prisma.customer.findFirst({
    where: { id: customerId, agencyId, deletedAt: null },
  });
  if (cust?.email) {
    createAndQueueNotification({
      agencyId,
      customerId,
      type: 'SUBSCRIPTION_RESUMED',
      channel: 'EMAIL',
      title: 'Subscription Resumed',
      message: 'Your subscription has been resumed.',
      emailTo: cust.email,
      emailSubject: 'Subscription Resumed - NewsFlow',
      templateData: { customerName: `${cust.firstName} ${cust.lastName}` },
    }).catch(() => {});
  }

  return { id: updated.id, status: updated.status };
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function calcProductCost(product: { basePrice: { toString: () => string }; dayRates?: { dayOfWeek: number; price: { toString: () => string } }[] }, startDate: Date): { billableDays: number; totalAmount: number; dayRateMap: Map<number, number> } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthEnd = new Date(year, month - 1, daysInMonth(year, month), 23, 59, 59, 999);
  const basePrice = Number(product.basePrice.toString());
  const dayRateMap = new Map<number, number>();
  for (const r of product.dayRates ?? []) {
    dayRateMap.set(r.dayOfWeek, Number(r.price.toString()));
  }

  const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  let billableDays = 0;
  let totalAmount = 0;
  for (let d = startDay.getDate(); d <= daysInMonth(year, month); d++) {
    const current = new Date(year, month - 1, d);
    if (current < startDay || current > monthEnd) continue;
    billableDays++;
    const dayRate = dayRateMap.get(current.getDay());
    totalAmount += dayRate ?? basePrice;
  }
  return { billableDays, totalAmount: Math.round(totalAmount * 100) / 100, dayRateMap };
}
