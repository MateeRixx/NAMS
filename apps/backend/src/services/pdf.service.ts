import PDFDocument from 'pdfkit';
import * as storageService from './storage.service.js';

function formatCurrency(amount: number): string {
  return `\u20B9 ${amount.toFixed(2)}`;
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
  taxRate: number;
  previousBalance: number;
  totalAmount: number;
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FONT_SIZE = 10;
const HEADING_SIZE = 18;
const SUBHEADING_SIZE = 14;
const COLORS = {
  primary: '#1a56db',
  text: '#333333',
  muted: '#6c757d',
  success: '#28a745',
  danger: '#dc3545',
  warning: '#d97706',
  border: '#dee2e6',
  headerBg: '#f8f9fa',
};

function drawTableRow(
  doc: typeof PDFDocument.prototype,
  y: number,
  cols: { x: number; width: number; text: string; align: string; bold?: boolean; color?: string }[],
  isHeader = false
): number {
  const rowHeight = isHeader ? 24 : 22;
  const textY = y + (rowHeight - FONT_SIZE) / 2;

  if (!isHeader) {
    doc.rect(MARGIN, y, CONTENT_WIDTH, rowHeight).fill('#ffffff');
  }

  for (const col of cols) {
    const x = MARGIN + col.x;
    if (isHeader) {
      doc.rect(x, y, col.width, rowHeight).fill(COLORS.headerBg);
    }
    doc.fillColor(col.color ?? (isHeader ? '#495057' : COLORS.text));
    if (col.bold) doc.font('Helvetica-Bold');
    else doc.font('Helvetica');
    doc.fontSize(isHeader ? 9 : FONT_SIZE);
    doc.text(col.text, x + 8, textY, {
      width: col.width - 16,
      align: col.align as 'left' | 'right' | 'center',
      lineBreak: false,
    });
  }

  if (!isHeader) {
    doc.rect(MARGIN, y + rowHeight - 1, CONTENT_WIDTH, 1).fill(COLORS.border);
  }

  return y + rowHeight;
}

function drawLabelValue(doc: typeof PDFDocument.prototype, x: number, y: number, label: string, value: string): number {
  doc.fontSize(8).fillColor(COLORS.muted).font('Helvetica').text(label, x, y);
  doc.fontSize(FONT_SIZE).fillColor(COLORS.text).font('Helvetica').text(value, x, y + 12);
  return y + 32;
}

function wrapText(doc: typeof PDFDocument.prototype, text: string, x: number, y: number, width: number): number {
  doc.fontSize(FONT_SIZE).fillColor(COLORS.text).font('Helvetica').text(text, x, y, { width, align: 'left' });
  return doc.y;
}

export async function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: MARGIN,
      info: {
        Title: `Invoice ${data.invoiceNumber}`,
        Author: data.agencyName,
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Card background
    doc.rect(MARGIN, MARGIN, CONTENT_WIDTH, PAGE_HEIGHT - MARGIN * 2).fill('#ffffff');
    doc.roundedRect(MARGIN, MARGIN, CONTENT_WIDTH, PAGE_HEIGHT - MARGIN * 2, 16).fill('#ffffff');

    // Header row
    let y = MARGIN + 30;
    doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(22).text(data.agencyName, MARGIN, y);

    const statusBadgeColors: Record<string, string> = { PAID: COLORS.success, GENERATED: COLORS.primary, PENDING: COLORS.warning, OVERDUE: COLORS.danger };
    const badgeColor = statusBadgeColors[data.invoiceStatus] ?? COLORS.muted;
    doc.roundedRect(PAGE_WIDTH - MARGIN - 160, y + 2, 160, 20, 10).fill(badgeColor);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9).text(`Invoice #${data.invoiceNumber}`, PAGE_WIDTH - MARGIN - 150, y + 6, { width: 140, align: 'center' });

    y += 28;

    doc.fontSize(8).fillColor(COLORS.muted).font('Helvetica').text(data.agencyAddress, MARGIN, y);
    y += 14;
    doc.text(`${data.agencyEmail}  |  ${data.agencyPhone}`, MARGIN, y);
    y += 20;

    // Separator
    doc.rect(MARGIN, y, CONTENT_WIDTH, 1).fill(COLORS.border);
    y += 25;

    // Bill To + Invoice Details
    const leftX = MARGIN;
    const rightX = MARGIN + CONTENT_WIDTH / 2 + 20;

    doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(SUBHEADING_SIZE).text('Billed To:', leftX, y);
    y += 20;

    doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(FONT_SIZE + 1).text(data.customerName, leftX, y);
    y += 16;
    doc.font('Helvetica').fontSize(FONT_SIZE);
    y = wrapText(doc, data.customerAddress, leftX, y, CONTENT_WIDTH / 2 - 10);
    y += 4;
    doc.text(data.customerPhone, leftX, y);
    y += 4;
    doc.text(`Code: ${data.customerCode}`, leftX, y);

    // Right side invoice details
    let ry = MARGIN + 85;
    drawLabelValue(doc, rightX, ry, 'Invoice Date:', data.generatedDate);
    ry += 36;
    drawLabelValue(doc, rightX, ry, 'Billing Period:', `${data.billingMonth} ${data.billingYear}`);
    ry += 36;
    drawLabelValue(doc, rightX, ry, 'Due Date:', data.dueDate);

    y = Math.max(y, ry) + 25;

    // Separator
    doc.rect(MARGIN, y, CONTENT_WIDTH, 1).fill(COLORS.border);
    y += 25;

    // Order Summary heading
    doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(SUBHEADING_SIZE).text('Order Summary', MARGIN, y);
    y += 25;

    // Table header
    const colDefs = [
      { x: 0, width: 40, text: '#', align: 'center' },
      { x: 40, width: 220, text: 'Item', align: 'left' },
      { x: 260, width: 60, text: 'Qty', align: 'center' },
      { x: 320, width: 85, text: 'Unit Price', align: 'right' },
      { x: 405, width: 90, text: 'Total', align: 'right' },
    ];

    y = drawTableRow(doc, y, colDefs.map((c) => ({ ...c, text: c.text })), true);
    let rowNum = 1;

    for (const item of data.items) {
      const cols = [
        { x: 0, width: 40, text: String(rowNum++).padStart(2, '0'), align: 'center' },
        { x: 40, width: 220, text: item.description, align: 'left' },
        { x: 260, width: 60, text: String(item.quantity), align: 'center' },
        { x: 320, width: 85, text: formatCurrency(item.unitPrice), align: 'right' },
        { x: 405, width: 90, text: formatCurrency(item.amount), align: 'right' },
      ];
      y = drawTableRow(doc, y, cols);
    }

    // Summary rows
    y += 5;
    const summaryX = MARGIN + 220;
    const summaryValX = MARGIN + 405;
    const summaryWidth = 90;

    const summaryRows: { label: string; value: string; bold?: boolean; color?: string }[] = [
      { label: 'Sub Total', value: formatCurrency(data.subtotal) },
      { label: 'Delivery Charges', value: formatCurrency(data.deliveryCharges) },
    ];

    if (data.previousBalance > 0) {
      summaryRows.push({ label: 'Previous Balance (unpaid)', value: formatCurrency(data.previousBalance), color: COLORS.warning });
    }
    if (data.discountAmount > 0) {
      summaryRows.push({ label: 'SLA Penalty Discount', value: `-${formatCurrency(data.discountAmount)}`, color: COLORS.danger });
    }
    const halfRate = data.taxRate / 2;
    const taxHalf = data.taxAmount / 2;
    summaryRows.push({ label: `SGST (${halfRate}%)`, value: formatCurrency(taxHalf) });
    summaryRows.push({ label: `CGST (${halfRate}%)`, value: formatCurrency(taxHalf) });

    for (const row of summaryRows) {
      doc.fillColor(row.color ?? COLORS.text).font(row.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(FONT_SIZE);
      doc.text(row.label, summaryX, y, { width: summaryWidth + 100, align: 'left' });
      doc.text(row.value, summaryValX, y, { width: summaryWidth, align: 'right' });
      y += 18;
    }

    // Total row
    y += 4;
    doc.rect(MARGIN + 220, y - 4, CONTENT_WIDTH - 220, 28).fill(COLORS.primary);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(FONT_SIZE + 2);
    doc.text('Total Amount', summaryX + 8, y + 4);
    doc.text(formatCurrency(data.totalAmount), summaryValX, y + 4, { width: summaryWidth, align: 'right' });
    y += 40;

    // Footer
    doc.rect(MARGIN, PAGE_HEIGHT - MARGIN - 50, CONTENT_WIDTH, 1).fill(COLORS.border);
    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8);
    doc.text('This is a computer-generated invoice. No signature required.', MARGIN, PAGE_HEIGHT - MARGIN - 40, { align: 'center' });
    doc.text(`${data.agencyName} | ${data.agencyPhone} | ${data.agencyEmail}`, MARGIN, PAGE_HEIGHT - MARGIN - 28, { align: 'center' });

    doc.end();
  });
}

export async function generateAndStoreInvoicePdf(
  data: InvoiceData,
  invoiceId: string
): Promise<{ buffer: Buffer; storageUrl: string }> {
  const pdfBuffer = await generateInvoicePdf(data);

  let storageUrl = '';
  try {
    const storageKey = `invoices/${invoiceId}.pdf`;
    storageUrl = await storageService.uploadPdf(storageKey, pdfBuffer);
  } catch (err) {
    console.error('[PDF] Failed to store invoice PDF in R2:', err);
  }

  return { buffer: pdfBuffer, storageUrl };
}
