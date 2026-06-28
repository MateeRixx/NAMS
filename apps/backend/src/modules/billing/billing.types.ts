export interface GenerateInvoiceDto {
  customerId: string;
  billingMonth: number;
  billingYear: number;
}

export interface InvoiceResponse {
  id: string;
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
  lockedAt: Date | null;
  status: string;
  generatedAt: Date;
  createdAt: Date;
  items: InvoiceItemResponse[];
}

export interface InvoiceItemResponse {
  id: string;
  invoiceId: string;
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  createdAt: Date;
}

export interface InvoiceListItem {
  id: string;
  agencyId: string;
  customerId: string;
  invoiceNumber: string;
  billingMonth: number;
  billingYear: number;
  totalAmount: number;
  status: string;
  generatedAt: Date;
}
