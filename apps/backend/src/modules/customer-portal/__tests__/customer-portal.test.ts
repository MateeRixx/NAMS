import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundError, ConflictError } from '@newsflow/shared';

import prisma from '@newsflow/database';

import * as subService from '../services/subscription.service.js';
import * as invService from '../services/invoice.service.js';
import * as compService from '../services/complaint.service.js';

vi.mock('@newsflow/database', () => ({
  default: {
    customer: { findFirst: vi.fn(), findMany: vi.fn() },
    product: { findMany: vi.fn(), findUnique: vi.fn() },
    subscription: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    invoice: { findMany: vi.fn(), findFirst: vi.fn() },
    complaint: { findMany: vi.fn(), create: vi.fn(), count: vi.fn().mockResolvedValue(0) },
    complaintHistory: { create: vi.fn() },
    pause: { create: vi.fn(), findMany: vi.fn() },
    auditLog: { create: vi.fn() },
    address: { findMany: vi.fn(), findFirst: vi.fn() },
    deliveryZone: { findFirst: vi.fn(), findMany: vi.fn() },
    payment: { create: vi.fn() },
    distributionRequest: { findMany: vi.fn(), create: vi.fn() },
    distributionRequestZone: { createMany: vi.fn() },
    articleRequest: { findMany: vi.fn(), create: vi.fn() },
  },
}));

vi.mock('../../config/index.js', () => ({
  config: { PAYMENT_KEY_ID: 'rzp_test_key', PAYMENT_KEY_SECRET: 'test_secret' },
}));

vi.mock('../../services/notification.service.js', () => ({
  createAndQueueNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../services/audit.service.js', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../services/pdf.service.js', () => ({
  generateAndStoreInvoicePdf: vi
    .fn()
    .mockResolvedValue({ buffer: Buffer.from(''), storageUrl: 'test' }),
}));

vi.mock('../../services/payment-gateway.service.js', () => ({
  getPaymentGateway: vi.fn().mockReturnValue({
    createOrder: vi.fn().mockResolvedValue({ id: 'order_1', amount: 1000, currency: 'INR' }),
    verifyPayment: vi.fn().mockReturnValue(true),
  }),
}));

vi.mock('../payment/payment.repository.js', () => ({
  getNextPaymentNumber: vi.fn().mockResolvedValue(1),
}));

vi.mock('../billing-charge/billing-charge.repository.js', () => ({
  listActiveCharges: vi.fn().mockResolvedValue([]),
}));

vi.mock('../billing/billing.repository.js', () => ({
  findCustomerById: vi.fn(),
  findExistingInvoice: vi.fn(),
  findActiveSubscriptionsInPeriod: vi.fn(),
  findProductDayRates: vi.fn(),
  findPrimaryAddressZone: vi.fn(),
  findResolvedComplaintsInPeriod: vi.fn(),
  findUnresolvedComplaintsInPeriod: vi.fn(),
  sumUnpaidPreviousInvoices: vi.fn(),
  getNextInvoiceSequence: vi.fn(),
  createInvoiceWithItems: vi.fn(),
  findInvoiceById: vi.fn(),
  findAgencyById: vi.fn(),
  findCustomerPrimaryAddress: vi.fn(),
  listInvoices: vi.fn(),
  findDayRateForProduct: vi.fn(),
}));

vi.mock('../billing/billing.service.js', () => ({
  generateCancellationInvoice: vi.fn().mockResolvedValue({ id: 'cancel-inv-1' }),
  generateInvoice: vi.fn().mockResolvedValue({ id: 'inv-1' }),
  getInvoicePdf: vi.fn().mockResolvedValue(Buffer.from('pdf')),
}));

const mockCustomer = {
  id: 'cust-1',
  agencyId: 'agency-1',
  firstName: 'John',
  lastName: 'Doe',
  status: 'ACTIVE',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('subscription service', () => {
  describe('listSubscriptions', () => {
    it('throws NotFoundError when customer does not exist', async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(null);
      await expect(subService.listSubscriptions('nonexistent', 'agency-1')).rejects.toThrow(
        NotFoundError
      );
    });

    it('returns subscriptions with product details', async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(mockCustomer as never);
      vi.mocked(prisma.subscription.findMany).mockResolvedValue([
        {
          id: 'sub-1',
          productId: 'prod-1',
          startDate: new Date('2026-01-01'),
          endDate: null,
          status: 'ACTIVE',
          createdAt: new Date('2026-01-01'),
          pauses: [],
          product: { name: 'Daily News', type: 'NEWSPAPER', basePrice: { toString: () => '10' } },
        },
      ] as never);

      const result = await subService.listSubscriptions('cust-1', 'agency-1');
      expect(result).toHaveLength(1);
      expect(result[0]!.productName).toBe('Daily News');
      expect(result[0]!.status).toBe('ACTIVE');
    });
  });

  describe('cancelSubscription', () => {
    it('throws NotFoundError when subscription does not exist', async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(mockCustomer as never);
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null);
      await expect(subService.cancelSubscription('sub-x', 'cust-1', 'agency-1')).rejects.toThrow(
        NotFoundError
      );
    });
  });
});

describe('invoice service', () => {
  describe('listInvoices', () => {
    it('throws NotFoundError when customer does not exist', async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(null);
      await expect(invService.listInvoices('nonexistent', 'agency-1')).rejects.toThrow(
        NotFoundError
      );
    });

    it('returns empty list when no invoices', async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(mockCustomer as never);
      vi.mocked(prisma.invoice.findMany).mockResolvedValue([]);
      const result = await invService.listInvoices('cust-1', 'agency-1');
      expect(result).toEqual([]);
    });
  });

  describe('getInvoice', () => {
    it('throws NotFoundError when invoice does not exist', async () => {
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue(null);
      await expect(invService.getInvoice('inv-x', 'cust-1', 'agency-1')).rejects.toThrow(
        NotFoundError
      );
    });
  });
});

describe('complaint service', () => {
  describe('listComplaints', () => {
    it('throws NotFoundError when customer does not exist', async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(null);
      await expect(compService.listComplaints('nonexistent', 'agency-1')).rejects.toThrow(
        NotFoundError
      );
    });

    it('returns complaints list', async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(mockCustomer as never);
      vi.mocked(prisma.complaint.findMany).mockResolvedValue([
        {
          id: 'comp-1',
          type: 'DELIVERY',
          description: 'Late',
          status: 'PENDING',
          createdAt: new Date(),
          resolvedAt: null,
        },
      ] as never);
      const result = await compService.listComplaints('cust-1', 'agency-1');
      expect(result).toHaveLength(1);
      expect(result[0]!.type).toBe('DELIVERY');
    });
  });

  describe('createComplaint', () => {
    it('throws NotFoundError when customer does not exist', async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(null);
      await expect(
        compService.createComplaint('nonexistent', 'agency-1', { type: 'DELIVERY' })
      ).rejects.toThrow(NotFoundError);
    });

    it('creates and returns complaint', async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(mockCustomer as never);
      vi.mocked(prisma.complaint.create).mockResolvedValue({
        id: 'comp-1',
        customerId: 'cust-1',
        agencyId: 'agency-1',
        type: 'DELIVERY',
        description: null,
        status: 'PENDING',
        createdAt: new Date(),
        resolvedAt: null,
      } as never);
      const result = await compService.createComplaint('cust-1', 'agency-1', { type: 'DELIVERY' });
      expect(result.type).toBe('DELIVERY');
      expect(result.status).toBe('PENDING');
    });
  });
});
