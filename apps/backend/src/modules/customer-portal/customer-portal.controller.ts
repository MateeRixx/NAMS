import { type Request, type Response, type NextFunction } from 'express';
import * as customerPortalService from './customer-portal.service.js';

export async function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await customerPortalService.getDashboard(req.user!.userId, req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await customerPortalService.listProducts(req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function createSubscription(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await customerPortalService.createSubscription(
      req.user!.userId,
      req.user!.agencyId,
      req.body as { productId: string; startDate?: string }
    );
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listSubscriptions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await customerPortalService.listSubscriptions(
      req.user!.userId,
      req.user!.agencyId
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function pauseSubscription(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await customerPortalService.pauseSubscription(
      id,
      req.user!.userId,
      req.user!.agencyId,
      req.body as { startDate: string; endDate: string; reason?: string }
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function resumeSubscription(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await customerPortalService.resumeSubscription(
      id,
      req.user!.userId,
      req.user!.agencyId
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await customerPortalService.listInvoices(req.user!.userId, req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await customerPortalService.getInvoice(id, req.user!.userId, req.user!.agencyId);
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
    const result = await customerPortalService.downloadInvoicePdf(
      id,
      req.user!.userId,
      req.user!.agencyId
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${id}.pdf`);
    res.send(result);
  } catch (error) {
    next(error);
  }
}

export async function listComplaints(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await customerPortalService.listComplaints(req.user!.userId, req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function createComplaint(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await customerPortalService.createComplaint(
      req.user!.userId,
      req.user!.agencyId,
      req.body as { type: string; description?: string }
    );
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listAddresses(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await customerPortalService.listAddresses(req.user!.userId, req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function createAddress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await customerPortalService.createAddress(
      req.user!.userId,
      req.user!.agencyId,
      req.body as {
        houseNumber: string;
        street: string;
        landmark?: string;
        area: string;
        city: string;
        state: string;
        postalCode: string;
        isPrimary?: boolean;
      }
    );
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function updateAddress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await customerPortalService.updateAddress(
      id,
      req.user!.userId,
      req.user!.agencyId,
      req.body as {
        houseNumber?: string;
        street?: string;
        landmark?: string | null;
        area?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        isPrimary?: boolean;
      }
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function deleteAddress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params['id']!;
    await customerPortalService.deleteAddress(id, req.user!.userId, req.user!.agencyId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await customerPortalService.getProfile(req.user!.userId, req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await customerPortalService.updateProfile(
      req.user!.userId,
      req.user!.agencyId,
      req.body as { firstName?: string; lastName?: string; email?: string | null }
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
