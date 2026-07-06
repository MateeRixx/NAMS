import prisma from '@newsflow/database';

export async function getNextPaymentNumber(agencyId: string): Promise<string> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const ym = `${year}${String(month).padStart(2, '0')}`;
  const count = await prisma.payment.count({
    where: {
      agencyId,
      createdAt: {
        gte: new Date(year, month - 1, 1),
        lt: new Date(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1),
      },
    },
  });
  return `PAY-${ym}-${String(count + 1).padStart(4, '0')}`;
}

export async function findPaymentById(id: string, agencyId: string) {
  return prisma.payment.findFirst({
    where: { id, agencyId },
    include: {
      invoice: { select: { invoiceNumber: true } },
      customer: { select: { firstName: true, lastName: true } },
    },
  });
}

export async function findInvoiceById(invoiceId: string, agencyId: string) {
  return prisma.invoice.findFirst({
    where: { id: invoiceId, agencyId },
    include: { customer: { select: { firstName: true, lastName: true, email: true } } },
  });
}

export async function createPayment(data: {
  agencyId: string;
  invoiceId: string;
  customerId: string;
  paymentNumber: string;
  amount: number;
  method: string;
  transactionReference?: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
}) {
  return prisma.payment.create({
    data: {
      agencyId: data.agencyId,
      invoiceId: data.invoiceId,
      customerId: data.customerId,
      paymentNumber: data.paymentNumber,
      amount: data.amount,
      method: data.method as never,
      status: 'PAID',
      transactionReference: data.transactionReference,
      gatewayOrderId: data.gatewayOrderId,
      gatewayPaymentId: data.gatewayPaymentId,
      paidAt: new Date(),
      attemptCount: 1,
    },
    include: {
      invoice: { select: { invoiceNumber: true } },
      customer: { select: { firstName: true, lastName: true } },
    },
  });
}

export async function listPayments(agencyId: string, page: number, pageSize: number) {
  const offset = (page - 1) * pageSize;
  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where: { agencyId },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: pageSize,
      include: {
        invoice: { select: { invoiceNumber: true } },
        customer: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.payment.count({ where: { agencyId } }),
  ]);
  return { payments, total };
}

export async function findPaymentsByInvoiceId(invoiceId: string, agencyId: string) {
  return prisma.payment.findMany({
    where: { invoiceId, agencyId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updatePaymentStatus(
  id: string,
  agencyId: string,
  data: {
    status: string;
    transactionReference?: string;
    failureReason?: string | null;
    attemptCount?: number;
    gatewayPaymentId?: string;
  }
) {
  return prisma.payment.updateMany({
    where: { id, agencyId },
    data: {
      ...data,
      status: data.status as never,
      paidAt: data.status === 'PAID' ? new Date() : undefined,
    },
  });
}

export async function updateInvoiceStatus(invoiceId: string, agencyId: string, status: string) {
  return prisma.invoice.updateMany({
    where: { id: invoiceId, agencyId },
    data: { status: status as never },
  });
}

export async function createRefund(data: {
  agencyId: string;
  paymentId: string;
  amount: number;
  reason?: string;
  gatewayRefundId?: string;
}) {
  return prisma.paymentRefund.create({ data });
}

export async function findRefundById(id: string, agencyId: string) {
  return prisma.paymentRefund.findFirst({
    where: { id, agencyId },
    include: { payment: { select: { transactionReference: true, invoiceId: true } } },
  });
}

export async function listRefunds(agencyId: string, page: number, pageSize: number) {
  const offset = (page - 1) * pageSize;
  const [refunds, total] = await Promise.all([
    prisma.paymentRefund.findMany({
      where: { agencyId },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: pageSize,
      include: {
        payment: {
          include: {
            invoice: { select: { invoiceNumber: true } },
            customer: { select: { firstName: true, lastName: true } },
          },
        },
      },
    }),
    prisma.paymentRefund.count({ where: { agencyId } }),
  ]);
  return { refunds, total };
}

export async function findFailedPayments(agencyId: string) {
  const MAX_RETRY_ATTEMPTS = 3;
  return prisma.payment.findMany({
    where: {
      agencyId,
      status: 'FAILED',
      attemptCount: { lt: MAX_RETRY_ATTEMPTS },
    },
    include: {
      invoice: { select: { invoiceNumber: true, totalAmount: true } },
      customer: { select: { firstName: true, lastName: true, email: true } },
    },
  });
}

export async function findOrCreateGatewayConfig(
  agencyId: string,
  data: { provider: string; apiKey: string; apiSecret: string; webhookSecret?: string }
) {
  return prisma.paymentGatewayConfig.upsert({
    where: { agencyId },
    create: { agencyId, ...data, provider: data.provider as never },
    update: { ...data, provider: data.provider as never },
  });
}

export async function findGatewayConfig(agencyId: string) {
  return prisma.paymentGatewayConfig.findUnique({ where: { agencyId } });
}
