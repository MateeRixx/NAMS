import { NotFoundError } from '@newsflow/shared';
import prisma from '@newsflow/database';

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

  const pdfBuffer = Buffer.from('PDF placeholder - integration pending');
  return pdfBuffer;
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
  phone: string;
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
