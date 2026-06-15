import prisma from '@newsflow/database';
import * as billingRepository from '../modules/billing/billing.repository.js';
import { generateInvoice } from '../modules/billing/billing.service.js';

export async function generateMonthlyInvoices(): Promise<{ success: number; skipped: number; errors: number }> {
  const now = new Date();
  const billingMonth = now.getMonth();
  const billingYear = now.getFullYear();

  let billingM = billingMonth;
  let billingY = billingYear;
  if (billingM === 0) {
    billingM = 12;
    billingY -= 1;
  }

  let success = 0;
  let skipped = 0;
  let errors = 0;

  const agencies = await prisma.agency.findMany({ select: { id: true } });

  for (const agency of agencies) {
    const customers = await billingRepository.findCustomersWithActiveSubscriptions(agency.id);

    for (const customer of customers) {
      try {
        const existing = await billingRepository.findExistingInvoice(
          customer.id,
          agency.id,
          billingM,
          billingY
        );
        if (existing) {
          skipped += 1;
          continue;
        }

        await generateInvoice(
          { customerId: customer.id, billingMonth: billingM, billingYear: billingY },
          agency.id
        );
        success += 1;
      } catch (error) {
        console.error(`[BillingCron] Failed invoice for customer ${customer.id}:`, error);
        errors += 1;
      }
    }
  }

  return { success, skipped, errors };
}
