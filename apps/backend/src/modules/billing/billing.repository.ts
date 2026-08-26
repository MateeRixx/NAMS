import prisma from '@newsflow/database';

type ProductFrequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY';

export async function findExistingInvoice(
  customerId: string,
  agencyId: string,
  billingMonth: number,
  billingYear: number
) {
  return prisma.invoice.findFirst({
    where: { customerId, agencyId, billingMonth, billingYear },
  });
}

export async function findActiveSubscriptionsInPeriod(
  customerId: string,
  agencyId: string,
  startOfMonth: Date,
  endOfMonth: Date
) {
  return prisma.subscription.findMany({
    where: {
      customerId,
      agencyId,
      status: { in: ['ACTIVE', 'PAUSED'] },
      startDate: { lte: endOfMonth },
      OR: [{ endDate: null }, { endDate: { gte: startOfMonth } }],
    },
    include: {
      product: true,
      pauses: {
        where: {
          startDate: { lte: endOfMonth },
          endDate: { gte: startOfMonth },
        },
      },
    },
  });
}

export async function findDayRateForProduct(
  productId: string,
  dayOfWeek: number,
  frequency?: string
): Promise<number | null> {
  const rate = await prisma.productDayRate.findFirst({
    where: {
      productId,
      dayOfWeek,
      frequency: (frequency ?? 'DAILY') as ProductFrequency,
    },
    select: { price: true },
  });
  return rate ? Number(rate.price.toString()) : null;
}

export async function findProductDayRates(productId: string) {
  return prisma.productDayRate.findMany({
    where: { productId },
  });
}

export async function findPrimaryAddressZone(customerId: string, agencyId: string) {
  const address = await prisma.address.findFirst({
    where: { customerId, agencyId, isPrimary: true },
    include: { deliveryZone: true },
  });
  return address?.deliveryZone ?? null;
}

export async function findResolvedComplaintsInPeriod(
  customerId: string,
  agencyId: string,
  startDate: Date,
  endDate: Date
) {
  return prisma.complaint.findMany({
    where: {
      customerId,
      agencyId,
      status: 'RESOLVED',
      AND: [{ createdAt: { gte: startDate, lte: endDate } }],
    },
    include: {
      subscription: {
        include: { product: { select: { id: true, name: true, basePrice: true, frequency: true } } },
      },
    },
  });
}

export async function findUnresolvedComplaintsInPeriod(
  customerId: string,
  agencyId: string,
  startOfMonth: Date,
  endOfMonth: Date
) {
  return prisma.complaint.findMany({
    where: {
      customerId,
      agencyId,
      status: { in: ['PENDING', 'IN_PROGRESS'] },
      createdAt: { gte: startOfMonth, lte: endOfMonth },
    },
  });
}

export async function sumUnpaidPreviousInvoices(
  customerId: string,
  agencyId: string,
  beforeMonth: number,
  beforeYear: number
): Promise<number> {
  const result = await prisma.invoice.aggregate({
    where: {
      customerId,
      agencyId,
      status: { not: 'PAID' },
      OR: [
        { billingYear: { lt: beforeYear } },
        { billingYear: beforeYear, billingMonth: { lt: beforeMonth } },
      ],
    },
    _sum: { totalAmount: true },
  });
  return Number(result._sum.totalAmount?.toString() ?? 0);
}

export async function getNextInvoiceSequence(
  agencyId: string,
  billingMonth: number,
  billingYear: number
) {
  const count = await prisma.invoice.count({
    where: { agencyId, billingMonth, billingYear },
  });
  return count + 1;
}

export async function createInvoiceWithItems(data: {
  agencyId: string;
  customerId: string;
  invoiceNumber: string;
  billingMonth: number;
  billingYear: number;
  subtotal: number;
  deliveryCharges: number;
  discountAmount: number;
  taxAmount: number;
  taxRate: number;
  previousBalance: number;
  totalAmount: number;
  lockedAt: Date;
  status: string;
  generatedAt: Date;
  items: {
    productId: string | null;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
}) {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.create({
      data: {
        agencyId: data.agencyId,
        customerId: data.customerId,
        invoiceNumber: data.invoiceNumber,
        billingMonth: data.billingMonth,
        billingYear: data.billingYear,
        subtotal: data.subtotal,
        deliveryCharges: data.deliveryCharges,
        discountAmount: data.discountAmount,
        taxAmount: data.taxAmount,
        taxRate: data.taxRate,
        previousBalance: data.previousBalance,
        totalAmount: data.totalAmount,
        lockedAt: data.lockedAt,
        status: data.status as never,
        generatedAt: data.generatedAt,
      },
    });

    for (const item of data.items) {
      await tx.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
        },
      });
    }

    return tx.invoice.findUnique({
      where: { id: invoice.id },
      include: { items: true },
    });
  });
}

export async function findInvoiceById(id: string, agencyId: string) {
  return prisma.invoice.findFirst({
    where: { id, agencyId },
    include: { items: true },
  });
}

export async function listInvoices(agencyId: string, customerId?: string) {
  const where: Record<string, unknown> = { agencyId };
  if (customerId) {
    where['customerId'] = customerId;
  }

  return prisma.invoice.findMany({
    where: where as never,
    orderBy: [{ billingYear: 'desc' }, { billingMonth: 'desc' }],
  });
}

export async function findCustomersWithActiveSubscriptions(agencyId: string) {
  const customers = await prisma.customer.findMany({
    where: { agencyId, deletedAt: null, status: 'ACTIVE' },
    include: {
      subscriptions: {
        where: { status: { in: ['ACTIVE', 'PAUSED'] } },
        take: 1,
      },
    },
  });
  return customers.filter((c) => c.subscriptions.length > 0);
}

export async function findCustomerById(id: string, agencyId: string) {
  return prisma.customer.findFirst({
    where: { id, agencyId, deletedAt: null },
  });
}

export async function findAgencyById(id: string) {
  return prisma.agency.findUnique({ where: { id } });
}

export async function findCustomerPrimaryAddress(customerId: string, agencyId: string) {
  return prisma.address.findFirst({
    where: { customerId, agencyId, isPrimary: true },
  });
}
