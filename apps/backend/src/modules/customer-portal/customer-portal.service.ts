import { NotFoundError, ConflictError, ValidationError } from '@newsflow/shared';
import prisma from '@newsflow/database';
import { createAndQueueNotification } from '../../services/notification.service.js';
import { generateCancellationInvoice, getInvoicePdf } from '../billing/billing.service.js';
import * as billingRepository from '../billing/billing.repository.js';
import { logAudit } from '../../services/audit.service.js';
import { getPaymentGateway } from '../../services/payment-gateway.service.js';
import { getNextPaymentNumber } from '../payment/payment.repository.js';
import { config } from '../../config/index.js';

const TAX_RATE = 0.18;
const SLA_PENALTY_THRESHOLD = 3;
const SLA_DISCOUNT_RATE = 0.15;

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

export async function listProducts(
  agencyId: string
): Promise<
  { id: string; name: string; type: string; basePrice: number; description: string | null }[]
> {
  const products = await prisma.product.findMany({
    where: { agencyId, isActive: true },
    orderBy: { name: 'asc' },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    basePrice: Number(p.basePrice),
    description: p.description,
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
      product: { select: { name: true, type: true } },
      pauses: { orderBy: { startDate: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return subscriptions.map((s) => ({
    id: s.id,
    productName: s.product.name,
    productType: s.product.type,
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

export async function listComplaints(
  customerId: string,
  agencyId: string
): Promise<
  {
    id: string;
    type: string;
    description: string | null;
    status: string;
    createdAt: Date;
    resolvedAt: Date | null;
  }[]
> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, agencyId, deletedAt: null },
  });
  if (!customer) throw new NotFoundError('Customer');

  const complaints = await prisma.complaint.findMany({
    where: { customerId, agencyId },
    orderBy: { createdAt: 'desc' },
  });

  return complaints.map((c) => ({
    id: c.id,
    type: c.type,
    description: c.description,
    status: c.status,
    createdAt: c.createdAt,
    resolvedAt: c.resolvedAt,
  }));
}

export async function createComplaint(
  customerId: string,
  agencyId: string,
  data: { type: string; description?: string }
): Promise<{ id: string; type: string; status: string }> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, agencyId, deletedAt: null },
  });
  if (!customer) throw new NotFoundError('Customer');

  const complaint = await prisma.complaint.create({
    data: {
      agencyId,
      customerId,
      type: data.type as never,
      description: data.description ?? null,
      status: 'PENDING',
    },
  });

  await prisma.complaintHistory.create({
    data: {
      agencyId,
      complaintId: complaint.id,
      action: 'CREATED',
      performedBy: customerId,
    },
  });

  if (customer.email) {
    createAndQueueNotification({
      agencyId,
      customerId,
      type: 'COMPLAINT_CREATED',
      channel: 'EMAIL',
      title: 'Complaint Registered',
      message: `Your complaint (${data.type}) has been registered.`,
      emailTo: customer.email,
      emailSubject: `Complaint Registered - ${data.type}`,
      templateData: {
        customerName: `${customer.firstName} ${customer.lastName}`,
        complaintType: data.type,
      },
    }).catch(() => {});
  }

  return { id: complaint.id, type: complaint.type, status: complaint.status };
}

export async function getProfile(
  customerId: string,
  agencyId: string
): Promise<{
  id: string;
  customerCode: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
}> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, agencyId, deletedAt: null },
  });
  if (!customer) throw new NotFoundError('Customer');

  return {
    id: customer.id,
    customerCode: customer.customerCode,
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone,
    email: customer.email,
  };
}

export async function getOnboardingStatus(customerId: string, agencyId: string): Promise<{ completed: boolean }> {
  const address = await prisma.address.findFirst({
    where: { customerId, agencyId, isPrimary: true },
  });
  return { completed: !!address };
}

export async function listAddresses(
  customerId: string,
  agencyId: string
): Promise<
  {
    id: string;
    houseNumber: string;
    street: string;
    landmark: string | null;
    area: string;
    city: string;
    state: string;
    postalCode: string;
    isPrimary: boolean;
    zone: { id: string; name: string } | null;
  }[]
> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, agencyId, deletedAt: null },
  });
  if (!customer) throw new NotFoundError('Customer');

  const addresses = await prisma.address.findMany({
    where: { customerId, agencyId },
    include: { deliveryZone: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return addresses.map((a) => ({
    id: a.id,
    houseNumber: a.houseNumber,
    street: a.street,
    landmark: a.landmark,
    area: a.area,
    city: a.city,
    state: a.state,
    postalCode: a.postalCode,
    isPrimary: a.isPrimary,
    zone: a.deliveryZone ? { id: a.deliveryZone.id, name: a.deliveryZone.name } : null,
  }));
}

export async function createAddress(
  customerId: string,
  agencyId: string,
  data: {
    houseNumber: string;
    street: string;
    landmark?: string;
    area: string;
    city: string;
    state: string;
    postalCode: string;
    isPrimary?: boolean;
  }
): Promise<{ id: string }> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, agencyId, deletedAt: null },
  });
  if (!customer) throw new NotFoundError('Customer');

  const address = await prisma.address.create({
    data: {
      agencyId,
      customerId,
      houseNumber: data.houseNumber,
      street: data.street,
      landmark: data.landmark ?? null,
      area: data.area,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      isPrimary: data.isPrimary ?? false,
    },
  });

  if (data.isPrimary) {
    await prisma.address.updateMany({
      where: { customerId, id: { not: address.id } },
      data: { isPrimary: false },
    });
  }

  return { id: address.id };
}

export async function updateAddress(
  addressId: string,
  customerId: string,
  agencyId: string,
  data: {
    houseNumber?: string;
    street?: string;
    landmark?: string | null;
    area?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    isPrimary?: boolean;
  }
): Promise<{ id: string }> {
  const address = await prisma.address.findFirst({
    where: { id: addressId, customerId, agencyId },
  });
  if (!address) throw new NotFoundError('Address');

  await prisma.address.update({
    where: { id: addressId },
    data: {
      ...(data.houseNumber !== undefined && { houseNumber: data.houseNumber }),
      ...(data.street !== undefined && { street: data.street }),
      ...(data.landmark !== undefined && { landmark: data.landmark }),
      ...(data.area !== undefined && { area: data.area }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.state !== undefined && { state: data.state }),
      ...(data.postalCode !== undefined && { postalCode: data.postalCode }),
      ...(data.isPrimary !== undefined && { isPrimary: data.isPrimary }),
    },
  });

  if (data.isPrimary) {
    await prisma.address.updateMany({
      where: { customerId, id: { not: addressId } },
      data: { isPrimary: false },
    });
  }

  return { id: addressId };
}

export async function deleteAddress(
  addressId: string,
  customerId: string,
  agencyId: string
): Promise<void> {
  const address = await prisma.address.findFirst({
    where: { id: addressId, customerId, agencyId },
  });
  if (!address) throw new NotFoundError('Address');

  await prisma.address.delete({ where: { id: addressId } });
}

export async function updateProfile(
  customerId: string,
  agencyId: string,
  data: { firstName?: string; lastName?: string; email?: string | null }
): Promise<{ id: string; firstName: string; lastName: string; email: string | null }> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, agencyId, deletedAt: null },
  });
  if (!customer) throw new NotFoundError('Customer');

  const updated = await prisma.customer.update({
    where: { id: customerId },
    data: {
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      ...(data.email !== undefined && { email: data.email }),
    },
  });

  return {
    id: updated.id,
    firstName: updated.firstName,
    lastName: updated.lastName,
    email: updated.email,
  };
}

export async function listMyDistributionRequests(customerId: string, agencyId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, agencyId, deletedAt: null },
  });
  if (!customer) throw new NotFoundError('Customer');

  return prisma.distributionRequest.findMany({
    where: { customerId, agencyId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createMyDistributionRequest(
  customerId: string,
  agencyId: string,
  data: { title: string; description?: string; requestedQuantity: number }
) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, agencyId, deletedAt: null },
  });
  if (!customer) throw new NotFoundError('Customer');

  const request = await prisma.distributionRequest.create({
    data: {
      agencyId,
      customerId,
      title: data.title,
      description: data.description ?? null,
      requestedQuantity: data.requestedQuantity,
      status: 'PENDING',
    },
  });

  if (customer.email) {
    createAndQueueNotification({
      agencyId,
      customerId,
      type: 'DISTRIBUTION_REQUEST_CREATED',
      channel: 'EMAIL',
      title: 'Distribution Request Received',
      message: `Your distribution request "${data.title}" has been received.`,
      emailTo: customer.email,
      emailSubject: 'Distribution Request Received - NewsFlow',
      templateData: {
        customerName: `${customer.firstName} ${customer.lastName}`,
        requestTitle: data.title,
      },
    }).catch(() => {});
  }

  return request;
}

export async function listMyArticleRequests(customerId: string, agencyId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, agencyId, deletedAt: null },
  });
  if (!customer) throw new NotFoundError('Customer');

  return prisma.articleRequest.findMany({
    where: { customerId, agencyId },
    orderBy: { createdAt: 'desc' },
    include: { product: { select: { name: true } } },
  });
}

export async function createMyArticleRequest(
  customerId: string,
  agencyId: string,
  data: { productId?: string; title: string; content: string; publishInDate?: string }
) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, agencyId, deletedAt: null },
  });
  if (!customer) throw new NotFoundError('Customer');

  const request = await prisma.articleRequest.create({
    data: {
      agencyId,
      customerId,
      productId: data.productId ?? null,
      title: data.title,
      content: data.content,
      publishInDate: data.publishInDate ? new Date(data.publishInDate) : null,
      status: 'SUBMITTED',
    },
  });

  if (customer.email) {
    createAndQueueNotification({
      agencyId,
      customerId,
      type: 'ARTICLE_REQUEST_SUBMITTED',
      channel: 'EMAIL',
      title: 'Article Submitted',
      message: `Your article "${data.title}" has been submitted for review.`,
      emailTo: customer.email,
      emailSubject: 'Article Submitted - NewsFlow',
      templateData: {
        customerName: `${customer.firstName} ${customer.lastName}`,
        articleTitle: data.title,
      },
    }).catch(() => {});
  }

  return request;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function calcProductCost(product: { basePrice: { toString: () => string }; dayRates?: { dayOfWeek: number; price: { toString: () => string } }[] }, startDate: Date): { billableDays: number; totalAmount: number; dayRateMap: Map<number, number> } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthEnd = new Date(year, month - 1, daysInMonth(year, month), 23, 59, 59, 999);
  const basePrice = Number(product.basePrice.toString());
  const dayRateMap = new Map<number, number>();
  for (const r of product.dayRates ?? []) {
    dayRateMap.set(r.dayOfWeek, Number(r.price.toString()));
  }

  let billableDays = 0;
  let totalAmount = 0;
  for (let d = startDate.getDate(); d <= daysInMonth(year, month); d++) {
    const current = new Date(year, month - 1, d);
    if (current < startDate || current > monthEnd) continue;
    billableDays++;
    const dayRate = dayRateMap.get(current.getDay());
    totalAmount += dayRate ?? basePrice;
  }
  return { billableDays, totalAmount: Math.round(totalAmount * 100) / 100, dayRateMap };
}

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
