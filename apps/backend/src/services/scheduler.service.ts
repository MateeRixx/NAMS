import cron from 'node-cron';
import { generateMonthlyInvoices } from './billing-cron.service.js';

let monthlyBillingJob: cron.ScheduledTask | null = null;

export function startScheduler(): void {
  monthlyBillingJob = cron.schedule('0 1 1 * *', async () => {
    console.log('[Scheduler] Running monthly billing...');
    const result = await generateMonthlyInvoices();
    console.log(
      `[Scheduler] Monthly billing complete: ${result.success} generated, ${result.skipped} skipped, ${result.errors} errors`
    );
  });

  console.log('Scheduler started - monthly billing on 1st of each month at 1:00 AM');
}

export function stopScheduler(): void {
  if (monthlyBillingJob) {
    monthlyBillingJob.stop();
    monthlyBillingJob = null;
    console.log('Scheduler stopped');
  }
}
