import puppeteer from 'puppeteer';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as storageService from './storage.service.js';

const currentDir = dirname(fileURLToPath(import.meta.url));

function loadTemplate(): string {
  const templatePath = resolve(currentDir, '..', 'templates', 'invoice.html');
  return readFileSync(templatePath, 'utf-8');
}

function formatCurrency(amount: number): string {
  return `₹ ${amount.toFixed(2)}`;
}

interface InvoiceData {
  agencyName: string;
  agencyAddress: string;
  agencyGst: string;
  agencyPhone: string;
  agencyEmail: string;
  invoiceNumber: string;
  generatedDate: string;
  dueDate: string;
  billingMonth: string;
  billingYear: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  customerCode: string;
  invoiceStatus: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
  subtotal: number;
  deliveryCharges: number;
  discountAmount: number;
  taxAmount: number;
  previousBalance: number;
  totalAmount: number;
}

function renderTemplate(data: InvoiceData): string {
  let html = loadTemplate();

  const taxHalf = data.taxAmount / 2;

  const itemRows = data.items
    .map(
      (item, idx) =>
        `<tr>
          <td class="item-number">${String(idx + 1).padStart(2, '0')}</td>
          <td>
            <div>
              <h5 class="text-truncate font-size-14 mb-1">${item.description}</h5>
            </div>
          </td>
          <td style="text-align:center">${item.quantity}</td>
          <td style="text-align:right">${formatCurrency(item.unitPrice)}</td>
          <td style="text-align:right">${formatCurrency(item.amount)}</td>
        </tr>`
    )
    .join('');

  const discountRow =
    data.discountAmount > 0
      ? `<tr><td colspan="4" class="text-end border-0 discount-text">SLA Penalty Discount</td><td class="border-0 discount-text">-${formatCurrency(data.discountAmount)}</td></tr>`
      : '';

  const previousBalanceRow =
    data.previousBalance > 0
      ? `<tr><td colspan="4" class="text-end border-0 previous-balance-text">Previous Balance (unpaid)</td><td class="border-0 previous-balance-text">${formatCurrency(data.previousBalance)}</td></tr>`
      : '';

  const replacements: Record<string, string> = {
    '{{agencyName}}': data.agencyName,
    '{{agencyAddress}}': data.agencyAddress,
    '{{agencyGst}}': data.agencyGst || 'N/A',
    '{{agencyPhone}}': data.agencyPhone,
    '{{agencyEmail}}': data.agencyEmail,
    '{{invoiceNumber}}': data.invoiceNumber,
    '{{generatedDate}}': data.generatedDate,
    '{{dueDate}}': data.dueDate,
    '{{billingMonth}}': data.billingMonth,
    '{{billingYear}}': data.billingYear,
    '{{customerName}}': data.customerName,
    '{{customerAddress}}': data.customerAddress,
    '{{customerPhone}}': data.customerPhone,
    '{{customerCode}}': data.customerCode,
    '{{invoiceStatus}}': data.invoiceStatus,
    '{{items}}': itemRows,
    '{{subtotal}}': formatCurrency(data.subtotal),
    '{{deliveryCharges}}': formatCurrency(data.deliveryCharges),
    '{{previousBalanceRow}}': previousBalanceRow,
    '{{discountRow}}': discountRow,
    '{{sgst}}': formatCurrency(taxHalf),
    '{{cgst}}': formatCurrency(taxHalf),
    '{{totalAmount}}': formatCurrency(data.totalAmount),
  };

  for (const [key, value] of Object.entries(replacements)) {
    html = html.replaceAll(key, value);
  }

  return html;
}

function getBrowserArgs(): string[] {
  return ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'];
}

export async function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  const launchOptions: Record<string, unknown> = {
    headless: true,
    args: getBrowserArgs(),
  };

  const systemChromium = process.env['PUPPETEER_EXECUTABLE_PATH'];
  if (systemChromium) {
    launchOptions['executablePath'] = systemChromium;
  }

  const browser = await puppeteer.launch(launchOptions as never);

  try {
    const page = await browser.newPage();
    const html = renderTemplate(data);
    await page.setContent(html, { waitUntil: 'load' });
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
      printBackground: true,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

export async function generateAndStoreInvoicePdf(
  data: InvoiceData,
  invoiceId: string
): Promise<{ buffer: Buffer; storageUrl: string }> {
  const pdfBuffer = await generateInvoicePdf(data);

  const storageKey = `invoices/${invoiceId}.pdf`;
  const storageUrl = await storageService.uploadPdf(storageKey, pdfBuffer);

  return { buffer: pdfBuffer, storageUrl };
}
