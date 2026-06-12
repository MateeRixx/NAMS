import { type Request, type Response, type NextFunction } from 'express';
import * as billingService from './billing.service.js';

export async function generateInvoice(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await billingService.generateInvoice(req.body as never, req.user!.agencyId);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await billingService.getInvoice(id, req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const customerId = req.query['customerId'] as string | undefined;
    const result = await billingService.listInvoices(req.user!.agencyId, customerId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function downloadInvoicePdf(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params['id']!;
    const pdfBuffer = await billingService.getInvoicePdf(id, req.user!.agencyId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (error) {
    next(error);
  }
}
