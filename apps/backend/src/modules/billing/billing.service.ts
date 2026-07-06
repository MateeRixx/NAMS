import { NotFoundError, ConflictError } from '@newsflow/shared';
import * as billingRepository from './billing.repository.js';
import * as billingChargeRepository from '../billing-charge/billing-charge.repository.js';
import { generateAndStoreInvoicePdf } from '../../services/pdf.service.js';
import { createAndQueueNotification } from '../../services/notification.service.js';
import { logAudit } from '../../services/audit.service.js';
import { config } from '../../config/index.js';
import type { GenerateInvoiceDto, InvoiceResponse, InvoiceListItem } from './billing.types.js';

const SLA_PENALTY_THRESHOLD = 3;
const SLA_DISCOUNT_RATE = 0.15;

function toInvoiceResponse(inv: {
  id: string;
  agencyId: string;
  customerId: string;
  invoiceNumber: string;
  billingMonth: number;
  billingYear: number;
  subtotal: { toString: () => string };
  deliveryCharges: { toString: () => string };
  discountAmount: { toString: () => string };
  taxAmount: { toString: () => string };
  taxRate: number;
  previousBalance: { toString: () => string };
  totalAmount: { toString: () => string };
  lockedAt: Date | null;
  status: string;
  generatedAt: Date;
  createdAt: Date;
  items: {
    id: string;
    invoiceId: string;
    productId: string | null;
    description: string;
    quantity: number;
    unitPrice: { toString: () => string };
    amount: { toString: () => string };
    createdAt: Date;
  }[];
}): InvoiceResponse {
  return {
    id: inv.id,
    agencyId: inv.agencyId,
    customerId: inv.customerId,
    invoiceNumber: inv.invoiceNumber,
    billingMonth: inv.billingMonth,
    billingYear: inv.billingYear,
    subtotal: Number(inv.subtotal.toString()),
    deliveryCharges: Number(inv.deliveryCharges.toString()),
    discountAmount: Number(inv.discountAmount.toString()),
    taxAmount: Number(inv.taxAmount.toString()),
    taxRate: inv.taxRate,
    previousBalance: Number(inv.previousBalance.toString()),
    totalAmount: Number(inv.totalAmount.toString()),
    lockedAt: inv.lockedAt,
    status: inv.status,
    generatedAt: inv.generatedAt,
    createdAt: inv.createdAt,
    items: inv.items.map((item) => ({
      id: item.id,
      invoiceId: item.invoiceId,
      productId: item.productId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice.toString()),
      amount: Number(item.amount.toString()),
      createdAt: item.createdAt,
    })),
  };
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getDateRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month - 1, daysInMonth(year, month), 23, 59, 59, 999);
  return { start, end };
}

export async function generateInvoice(
  dto: GenerateInvoiceDto,
  agencyId: string,
  userId?: string
): Promise<InvoiceResponse> {
  const customer = await billingRepository.findCustomerById(dto.customerId, agencyId);
  if (!customer) {
    throw new NotFoundError('Customer');
  }

  const { start: periodStart, end: periodEnd } = getDateRange(dto.billingYear, dto.billingMonth);

  const existing = await billingRepository.findExistingInvoice(
    dto.customerId,
    agencyId,
    dto.billingMonth,
    dto.billingYear
  );
  if (existing) {
    throw new ConflictError(`Invoice already exists for ${dto.billingMonth}/${dto.billingYear}`);
  }

  const agency = await billingRepository.findAgencyById(agencyId);
  const taxRate = agency?.taxRate ?? 18;
  const taxRateDecimal = taxRate / 100;

  const subscriptions = await billingRepository.findActiveSubscriptionsInPeriod(
    dto.customerId,
    agencyId,
    periodStart,
    periodEnd
  );

  if (subscriptions.length === 0) {
    throw new NotFoundError('No active subscriptions found for this period');
  }

  const productDayRateMap = new Map<string, Map<number, number>>();
  const invoiceItems: {
    productId: string | null;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[] = [];

  for (const sub of subscriptions) {
    const { productId } = sub;
    if (!productDayRateMap.has(productId)) {
      const rates = await billingRepository.findProductDayRates(productId);
      const rateMap = new Map<number, number>();
      for (const rate of rates) {
        rateMap.set(rate.dayOfWeek, Number(rate.price.toString()));
      }
      productDayRateMap.set(productId, rateMap);
    }
    const dayRates = productDayRateMap.get(productId)!;
    const basePrice = Number(sub.product.basePrice.toString());

    const pausePeriods: { start: Date; end: Date }[] = sub.pauses.map((p) => ({
      start: p.startDate,
      end: p.endDate,
    }));

    const startNorm = new Date(sub.startDate);
    startNorm.setHours(0, 0, 0, 0);
    const subStart = startNorm > periodStart ? startNorm : periodStart;
    const endNorm = sub.endDate ? new Date(sub.endDate) : null;
    if (endNorm) endNorm.setHours(23, 59, 59, 999);
    const subEnd = endNorm && endNorm < periodEnd ? endNorm : periodEnd;

    let billableCount = 0;
    let totalProductAmount = 0;

    const totalDays = daysInMonth(dto.billingYear, dto.billingMonth);
    for (let day = 1; day <= totalDays; day += 1) {
      const currentDate = new Date(dto.billingYear, dto.billingMonth - 1, day);
      if (currentDate < subStart || currentDate > subEnd) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const isPaused = pausePeriods.some(
        (pause) => currentDate >= pause.start && currentDate <= pause.end
      );
      if (isPaused) {
        // eslint-disable-next-line no-continue
        continue;
      }

      billableCount += 1;
      const dayOfWeek = currentDate.getDay();
      const dayRate = dayRates.get(dayOfWeek);
      totalProductAmount += dayRate ?? basePrice;
    }

    if (billableCount > 0) {
      invoiceItems.push({
        productId: sub.productId,
        description: `${sub.product.name} (${billableCount} days)`,
        quantity: billableCount,
        unitPrice: Math.round((totalProductAmount / billableCount) * 100) / 100,
        amount: Math.round(totalProductAmount * 100) / 100,
      });
    }
  }

  const productSubtotal =
    Math.round(invoiceItems.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;

  const activeCharges = await billingChargeRepository.listActiveCharges(agencyId);
  for (const charge of activeCharges) {
    const chargeAmount =
      charge.type === 'PERCENTAGE'
        ? Math.round(productSubtotal * (Number(charge.amount.toString()) / 100) * 100) / 100
        : Math.round(Number(charge.amount.toString()) * 100) / 100;
    if (chargeAmount > 0) {
      invoiceItems.push({
        productId: null,
        description: charge.name + (charge.description ? ` (${charge.description})` : ''),
        quantity: 1,
        unitPrice: chargeAmount,
        amount: chargeAmount,
      });
    }
  }

  const subtotal = Math.round(invoiceItems.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;

  const deliveryZone = await billingRepository.findPrimaryAddressZone(dto.customerId, agencyId);
  const deliveryCharges = deliveryZone
    ? Math.round(Number(deliveryZone.monthlyCharge.toString()) * 100) / 100
    : 0;

  const resolvedComplaints = await billingRepository.findResolvedComplaintsInPeriod(
    dto.customerId,
    agencyId,
    periodStart,
    periodEnd
  );

  let totalComplaintCredit = 0;
  for (const complaint of resolvedComplaints) {
    const sub = complaint.subscription;
    if (!sub) continue;
    const dateForRate = complaint.complaintDate ?? complaint.createdAt;
    const dayOfWeek = dateForRate.getDay();
    const dayRate = await billingRepository.findDayRateForProduct(sub.productId, dayOfWeek);
    const creditAmount = dayRate ?? Number(sub.product.basePrice.toString());
    const roundedCredit = Math.round(creditAmount * 100) / 100;
    const dateStr = dateForRate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    invoiceItems.push({
      productId: sub.productId,
      description: `Credit: ${complaint.type.replace(/_/g, ' ')} on ${dateStr} (${sub.product.name})`,
      quantity: 1,
      unitPrice: -roundedCredit,
      amount: -roundedCredit,
    });
    totalComplaintCredit += roundedCredit;
  }

  const unresolvedComplaints = await billingRepository.findUnresolvedComplaintsInPeriod(
    dto.customerId,
    agencyId,
    periodStart,
    periodEnd
  );

  let discountAmount = 0;
  if (unresolvedComplaints.length >= SLA_PENALTY_THRESHOLD) {
    discountAmount = Math.round(subtotal * SLA_DISCOUNT_RATE * 100) / 100;
  }

  const taxableAmount = subtotal + deliveryCharges - discountAmount;
  const taxAmount = Math.round(taxableAmount * taxRateDecimal * 100) / 100;

  const previousBalance = await billingRepository.sumUnpaidPreviousInvoices(
    dto.customerId,
    agencyId,
    dto.billingMonth,
    dto.billingYear
  );

  if (previousBalance > 0) {
    invoiceItems.push({
      productId: null,
      description: `Previous balance (unpaid invoices)`,
      quantity: 1,
      unitPrice: previousBalance,
      amount: previousBalance,
    });
  }

  const totalAmount = Math.round((taxableAmount + taxAmount + previousBalance) * 100) / 100;

  const seq = await billingRepository.getNextInvoiceSequence(
    agencyId,
    dto.billingMonth,
    dto.billingYear
  );
  const invoiceNumber = `INV-${dto.billingYear}${String(dto.billingMonth).padStart(2, '0')}-${String(seq).padStart(4, '0')}`;

  const now = new Date();
  const invoice = await billingRepository.createInvoiceWithItems({
    agencyId,
    customerId: dto.customerId,
    invoiceNumber,
    billingMonth: dto.billingMonth,
    billingYear: dto.billingYear,
    subtotal,
    deliveryCharges,
    discountAmount,
    taxAmount,
    taxRate,
    previousBalance,
    totalAmount,
    lockedAt: now,
    status: 'GENERATED',
    generatedAt: now,
    items: invoiceItems,
  });

  if (invoice) {
    createAndQueueNotification({
      agencyId,
      customerId: dto.customerId,
      type: 'INVOICE_GENERATED',
      channel: 'EMAIL',
      title: 'New Invoice Generated',
      message: `Invoice ${invoiceNumber} for ₹${totalAmount} has been generated.`,
      emailTo: customer.email ?? undefined,
      emailSubject: `Invoice ${invoiceNumber} Generated - NewsFlow`,
      templateData: {
        customerName: `${customer.firstName} ${customer.lastName}`,
        invoiceNumber,
        billingPeriod: `${dto.billingMonth}/${dto.billingYear}`,
        totalAmount: String(totalAmount),
        dueDate: new Date(Date.now() + 15 * 86400000).toLocaleDateString('en-IN'),
        invoiceId: invoice.id,
        portalUrl: config.MOBILE_APP_URL,
      },
    }).catch((err) => console.error('[BillingService] Failed to queue notification:', err));
  }

  logAudit({
    agencyId,
    userId,
    entityType: 'Invoice',
    entityId: invoice!.id,
    action: 'INVOICE_GENERATED',
    newValue: {
      invoiceNumber,
      totalAmount,
      billingMonth: dto.billingMonth,
      billingYear: dto.billingYear,
    },
  });

  return toInvoiceResponse(invoice!);
}

export async function getInvoice(id: string, agencyId: string): Promise<InvoiceResponse> {
  const invoice = await billingRepository.findInvoiceById(id, agencyId);
  if (!invoice) {
    throw new NotFoundError('Invoice');
  }
  return toInvoiceResponse(invoice);
}

export async function getInvoicePdf(id: string, agencyId: string): Promise<Buffer> {
  const invoice = await billingRepository.findInvoiceById(id, agencyId);
  if (!invoice) {
    throw new NotFoundError('Invoice');
  }

  const customer = await billingRepository.findCustomerById(invoice.customerId, agencyId);
  if (!customer) {
    throw new NotFoundError('Customer');
  }

  const agency = await billingRepository.findAgencyById(agencyId);
  const address = await billingRepository.findCustomerPrimaryAddress(customer.id, agencyId);

  const addressStr = address
    ? `${address.houseNumber}, ${address.street}, ${address.area}, ${address.city}, ${address.state} - ${address.postalCode}`
    : '';

  const customerName = `${customer.firstName} ${customer.lastName}`;

  const genDate = new Date(invoice.generatedAt);
  const dueDate = new Date(genDate);
  dueDate.setDate(dueDate.getDate() + 15);

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const items = invoice.items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice.toString()),
    amount: Number(item.amount.toString()),
  }));

  const pdfBuffer = await generateAndStoreInvoicePdf(
    {
      agencyName: agency?.name ?? 'NewsFlow Agency',
      agencyAddress: agency?.address ?? '',
      agencyGst: agency?.gstNumber ?? '',
      agencyPhone: agency?.phone ?? '',
      agencyEmail: agency?.email ?? '',
      invoiceNumber: invoice.invoiceNumber,
      generatedDate: genDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      dueDate: dueDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      billingMonth: monthNames[invoice.billingMonth - 1] ?? String(invoice.billingMonth),
      billingYear: String(invoice.billingYear),
      customerName,
      customerAddress: addressStr,
      customerPhone: customer.phone ?? '',
      customerCode: customer.customerCode,
      invoiceStatus: invoice.status,
      items,
      subtotal: Number(invoice.subtotal.toString()),
      deliveryCharges: Number(invoice.deliveryCharges.toString()),
      discountAmount: Number(invoice.discountAmount.toString()),
      taxAmount: Number(invoice.taxAmount.toString()),
      taxRate: invoice.taxRate,
      previousBalance: Number(invoice.previousBalance?.toString() ?? '0'),
      totalAmount: Number(invoice.totalAmount.toString()),
    },
    invoice.id
  );

  return pdfBuffer.buffer;
}

export async function generateCancellationInvoice(
  customerId: string,
  agencyId: string,
  subscriptionId: string,
  cancelDate: Date
): Promise<InvoiceResponse | null> {
  const customer = await billingRepository.findCustomerById(customerId, agencyId);
  if (!customer) {
    throw new NotFoundError('Customer');
  }

  const agency = await billingRepository.findAgencyById(agencyId);
  const taxRate = agency?.taxRate ?? 18;
  const taxRateDecimal = taxRate / 100;

  const month = cancelDate.getMonth() + 1;
  const year = cancelDate.getFullYear();

  const existing = await billingRepository.findExistingInvoice(customerId, agencyId, month, year);
  if (existing) {
    return null;
  }

  const periodStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const periodEnd = new Date(
    cancelDate.getFullYear(),
    cancelDate.getMonth(),
    cancelDate.getDate(),
    23,
    59,
    59,
    999
  );

  const subscriptions = await billingRepository.findActiveSubscriptionsInPeriod(
    customerId,
    agencyId,
    periodStart,
    periodEnd
  );

  const sub = subscriptions.find((s) => s.id === subscriptionId);

  if (!sub) {
    return null;
  }

  const productDayRateMap = new Map<string, Map<number, number>>();
  const invoiceItems: {
    productId: string | null;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[] = [];

  const { productId } = sub;
  if (!productDayRateMap.has(productId)) {
    const rates = await billingRepository.findProductDayRates(productId);
    const rateMap = new Map<number, number>();
    for (const rate of rates) {
      rateMap.set(rate.dayOfWeek, Number(rate.price.toString()));
    }
    productDayRateMap.set(productId, rateMap);
  }
  const dayRates = productDayRateMap.get(productId)!;
  const basePrice = Number(sub.product.basePrice.toString());

  const pausePeriods: { start: Date; end: Date }[] = sub.pauses.map((p) => ({
    start: p.startDate,
    end: p.endDate,
  }));

  const startNorm = new Date(sub.startDate);
  startNorm.setHours(0, 0, 0, 0);
  const subStart = startNorm > periodStart ? startNorm : periodStart;
  const endNorm = sub.endDate ? new Date(sub.endDate) : null;
  if (endNorm) endNorm.setHours(23, 59, 59, 999);
  const subEnd = endNorm && endNorm < periodEnd ? endNorm : periodEnd;

  let billableCount = 0;
  let totalProductAmount = 0;

  const totalDays = new Date(year, month, 0).getDate();
  for (let day = 1; day <= totalDays; day += 1) {
    const currentDate = new Date(year, month - 1, day);
    if (currentDate < subStart || currentDate > subEnd) {
      continue;
    }

    const isPaused = pausePeriods.some(
      (pause) => currentDate >= pause.start && currentDate <= pause.end
    );
    if (isPaused) {
      continue;
    }

    billableCount += 1;
    const dayOfWeek = currentDate.getDay();
    const dayRate = dayRates.get(dayOfWeek);
    totalProductAmount += dayRate ?? basePrice;
  }

  if (billableCount > 0) {
    invoiceItems.push({
      productId: sub.productId,
      description: `${sub.product.name} (${billableCount} days)`,
      quantity: billableCount,
      unitPrice: Math.round((totalProductAmount / billableCount) * 100) / 100,
      amount: Math.round(totalProductAmount * 100) / 100,
    });
  }

  if (invoiceItems.length === 0) {
    return null;
  }

  const productSubtotal =
    Math.round(invoiceItems.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
  const activeCharges = await billingChargeRepository.listActiveCharges(agencyId);
  for (const charge of activeCharges) {
    const chargeAmount =
      charge.type === 'PERCENTAGE'
        ? Math.round(productSubtotal * (Number(charge.amount.toString()) / 100) * 100) / 100
        : Math.round(Number(charge.amount.toString()) * 100) / 100;
    if (chargeAmount > 0) {
      invoiceItems.push({
        productId: null,
        description: charge.name,
        quantity: 1,
        unitPrice: chargeAmount,
        amount: chargeAmount,
      });
    }
  }

  const subtotal = Math.round(invoiceItems.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;

  const deliveryZone = await billingRepository.findPrimaryAddressZone(customerId, agencyId);
  const deliveryCharges = deliveryZone
    ? Math.round(Number(deliveryZone.monthlyCharge.toString()) * 100) / 100
    : 0;

  const resolvedComplaints = await billingRepository.findResolvedComplaintsInPeriod(
    customerId,
    agencyId,
    periodStart,
    periodEnd
  );

  let totalComplaintCredit = 0;
  for (const complaint of resolvedComplaints) {
    const sub = complaint.subscription;
    if (!sub) continue;
    const dateForRate = complaint.complaintDate ?? complaint.createdAt;
    const dayOfWeek = dateForRate.getDay();
    const dayRate = await billingRepository.findDayRateForProduct(sub.productId, dayOfWeek);
    const creditAmount = dayRate ?? Number(sub.product.basePrice.toString());
    const roundedCredit = Math.round(creditAmount * 100) / 100;
    const dateStr = dateForRate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    invoiceItems.push({
      productId: sub.productId,
      description: `Credit: ${complaint.type.replace(/_/g, ' ')} on ${dateStr} (${sub.product.name})`,
      quantity: 1,
      unitPrice: -roundedCredit,
      amount: -roundedCredit,
    });
    totalComplaintCredit += roundedCredit;
  }

  const unresolvedComplaints = await billingRepository.findUnresolvedComplaintsInPeriod(
    customerId,
    agencyId,
    periodStart,
    periodEnd
  );

  let discountAmount = 0;
  if (unresolvedComplaints.length >= SLA_PENALTY_THRESHOLD) {
    discountAmount = Math.round(subtotal * SLA_DISCOUNT_RATE * 100) / 100;
  }

  const taxableAmount = subtotal + deliveryCharges - discountAmount;
  const taxAmount = Math.round(taxableAmount * taxRateDecimal * 100) / 100;

  const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

  const seq = await billingRepository.getNextInvoiceSequence(agencyId, month, year);
  const invoiceNumber = `INV-${year}${String(month).padStart(2, '0')}-${String(seq).padStart(4, '0')}`;

  const now = new Date();
  const invoice = await billingRepository.createInvoiceWithItems({
    agencyId,
    customerId,
    invoiceNumber,
    billingMonth: month,
    billingYear: year,
    subtotal,
    deliveryCharges,
    discountAmount,
    taxAmount,
    taxRate,
    previousBalance: 0,
    totalAmount,
    lockedAt: now,
    status: 'GENERATED',
    generatedAt: now,
    items: invoiceItems,
  });

  if (invoice) {
    createAndQueueNotification({
      agencyId,
      customerId,
      type: 'INVOICE_GENERATED',
      channel: 'EMAIL',
      title: 'Final Invoice Generated',
      message: `Final invoice ${invoiceNumber} for ₹${totalAmount} has been generated.`,
      emailTo: customer.email ?? undefined,
      emailSubject: `Final Invoice ${invoiceNumber} - NewsFlow`,
      templateData: {
        customerName: `${customer.firstName} ${customer.lastName}`,
        invoiceNumber,
        billingPeriod: `${month}/${year}`,
        totalAmount: String(totalAmount),
        dueDate: new Date(Date.now() + 15 * 86400000).toLocaleDateString('en-IN'),
        invoiceId: invoice.id,
        portalUrl: config.MOBILE_APP_URL,
      },
    }).catch((err) => console.error('[BillingService] Failed to queue notification:', err));
  }

  return toInvoiceResponse(invoice!);
}

export async function listInvoices(
  agencyId: string,
  customerId?: string
): Promise<InvoiceListItem[]> {
  const invoices = await billingRepository.listInvoices(agencyId, customerId);
  return invoices.map((inv) => ({
    id: inv.id,
    agencyId: inv.agencyId,
    customerId: inv.customerId,
    invoiceNumber: inv.invoiceNumber,
    billingMonth: inv.billingMonth,
    billingYear: inv.billingYear,
    totalAmount: Number(inv.totalAmount.toString()),
    status: inv.status,
    generatedAt: inv.generatedAt,
  }));
}
