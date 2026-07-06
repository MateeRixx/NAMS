import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundError, ConflictError } from '@newsflow/shared';

import * as billingService from '../billing.service.js';
import * as billingRepository from '../billing.repository.js';

vi.mock('@newsflow/database', () => ({
  default: {},
}));

vi.mock('../../billing-charge/billing-charge.repository.js', () => ({
  listActiveCharges: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../services/pdf.service.js', () => ({
  generateAndStoreInvoicePdf: vi
    .fn()
    .mockResolvedValue({ buffer: Buffer.from(''), storageUrl: 'test' }),
}));

vi.mock('../../../services/notification.service.js', () => ({
  createAndQueueNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../services/audit.service.js', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../billing.repository.js', () => ({
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

const mockAgency = { id: 'agency-1', name: 'Test Agency', taxRate: 18 };
const mockCustomer = {
  id: 'customer-1',
  agencyId: 'agency-1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@test.com',
  phone: '1234567890',
  customerCode: 'C001',
};
const mockProduct = {
  id: 'product-1',
  name: 'Daily News',
  basePrice: { toString: () => '10' },
  type: 'NEWSPAPER',
};
const mockSubscription = {
  id: 'sub-1',
  productId: 'product-1',
  customerId: 'customer-1',
  agencyId: 'agency-1',
  startDate: new Date('2026-01-01'),
  endDate: null,
  status: 'ACTIVE',
  product: mockProduct,
  pauses: [],
};
const mockInvoiceData = {
  id: 'invoice-1',
  agencyId: 'agency-1',
  customerId: 'customer-1',
  invoiceNumber: 'INV-202601-0001',
  billingMonth: 1,
  billingYear: 2026,
  subtotal: { toString: () => '100' },
  deliveryCharges: { toString: () => '50' },
  discountAmount: { toString: () => '0' },
  taxAmount: { toString: () => '27' },
  taxRate: 18,
  previousBalance: { toString: () => '0' },
  totalAmount: { toString: () => '177' },
  lockedAt: new Date(),
  status: 'GENERATED',
  generatedAt: new Date(),
  createdAt: new Date(),
  items: [
    {
      id: 'item-1',
      invoiceId: 'invoice-1',
      productId: 'product-1',
      description: 'Daily News (10 days)',
      quantity: 10,
      unitPrice: { toString: () => '10' },
      amount: { toString: () => '100' },
      createdAt: new Date(),
    },
  ],
};

describe('Billing Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateInvoice', () => {
    it('should throw NotFoundError when customer does not exist', async () => {
      vi.mocked(billingRepository.findCustomerById).mockResolvedValue(null);

      await expect(
        billingService.generateInvoice(
          { customerId: 'nonexistent', billingMonth: 1, billingYear: 2026 },
          'agency-1'
        )
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when invoice already exists for period', async () => {
      vi.mocked(billingRepository.findCustomerById).mockResolvedValue(mockCustomer as never);
      vi.mocked(billingRepository.findExistingInvoice).mockResolvedValue({
        id: 'existing',
      } as never);

      await expect(
        billingService.generateInvoice(
          { customerId: 'customer-1', billingMonth: 1, billingYear: 2026 },
          'agency-1'
        )
      ).rejects.toThrow(ConflictError);
    });

    it('should throw NotFoundError when no active subscriptions found', async () => {
      vi.mocked(billingRepository.findCustomerById).mockResolvedValue(mockCustomer as never);
      vi.mocked(billingRepository.findExistingInvoice).mockResolvedValue(null);
      vi.mocked(billingRepository.findAgencyById).mockResolvedValue(mockAgency as never);
      vi.mocked(billingRepository.findActiveSubscriptionsInPeriod).mockResolvedValue([]);

      await expect(
        billingService.generateInvoice(
          { customerId: 'customer-1', billingMonth: 1, billingYear: 2026 },
          'agency-1'
        )
      ).rejects.toThrow(NotFoundError);
    });

    it('should generate invoice successfully with correct structure', async () => {
      vi.mocked(billingRepository.findCustomerById).mockResolvedValue(mockCustomer as never);
      vi.mocked(billingRepository.findExistingInvoice).mockResolvedValue(null);
      vi.mocked(billingRepository.findAgencyById).mockResolvedValue(mockAgency as never);
      vi.mocked(billingRepository.findActiveSubscriptionsInPeriod).mockResolvedValue([
        mockSubscription,
      ] as never);
      vi.mocked(billingRepository.findProductDayRates).mockResolvedValue([]);
      vi.mocked(billingRepository.findPrimaryAddressZone).mockResolvedValue({
        monthlyCharge: { toString: () => '50' },
      } as never);
      vi.mocked(billingRepository.findResolvedComplaintsInPeriod).mockResolvedValue([]);
      vi.mocked(billingRepository.findUnresolvedComplaintsInPeriod).mockResolvedValue([]);
      vi.mocked(billingRepository.sumUnpaidPreviousInvoices).mockResolvedValue(0);
      vi.mocked(billingRepository.getNextInvoiceSequence).mockResolvedValue(1);
      vi.mocked(billingRepository.createInvoiceWithItems).mockResolvedValue(
        mockInvoiceData as never
      );

      const result = await billingService.generateInvoice(
        { customerId: 'customer-1', billingMonth: 1, billingYear: 2026 },
        'agency-1',
        'user-1'
      );

      expect(result).toBeDefined();
      expect(result.invoiceNumber).toBe('INV-202601-0001');
      expect(result.status).toBe('GENERATED');
      expect(result.taxRate).toBe(18);
      expect(result.lockedAt).toBeInstanceOf(Date);
      expect(result.items.length).toBeGreaterThan(0);
    });
  });

  describe('getInvoice', () => {
    it('should throw NotFoundError when invoice does not exist', async () => {
      vi.mocked(billingRepository.findInvoiceById).mockResolvedValue(null);

      await expect(billingService.getInvoice('nonexistent', 'agency-1')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should return invoice when found', async () => {
      vi.mocked(billingRepository.findInvoiceById).mockResolvedValue(mockInvoiceData as never);

      const result = await billingService.getInvoice('invoice-1', 'agency-1');
      expect(result).toBeDefined();
      expect(result.id).toBe('invoice-1');
    });
  });

  describe('listInvoices', () => {
    it('should return empty array when no invoices', async () => {
      vi.mocked(billingRepository.listInvoices).mockResolvedValue([]);

      const result = await billingService.listInvoices('agency-1');
      expect(result).toEqual([]);
    });

    it('should return list of invoices', async () => {
      vi.mocked(billingRepository.listInvoices).mockResolvedValue([mockInvoiceData] as never);

      const result = await billingService.listInvoices('agency-1');
      expect(result).toHaveLength(1);
      expect(result[0]!.invoiceNumber).toBe('INV-202601-0001');
    });
  });
});
