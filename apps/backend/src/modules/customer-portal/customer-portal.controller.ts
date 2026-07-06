import { type Request, type Response, type NextFunction } from 'express';
import * as subService from './services/subscription.service.js';
import * as invService from './services/invoice.service.js';
import * as profileService from './services/profile.service.js';
import * as reqService from './services/request.service.js';
import * as compService from './services/complaint.service.js';
import * as cartService from './services/cart.service.js';

export async function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await subService.getDashboard(req.user!.userId, req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await subService.listProducts(req.user!.agencyId);
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
    const result = await subService.createSubscription(
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
    const result = await subService.listSubscriptions(req.user!.userId, req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function cancelSubscription(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await subService.cancelSubscription(id, req.user!.userId, req.user!.agencyId);
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
    const result = await subService.pauseSubscription(
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
    const result = await subService.resumeSubscription(id, req.user!.userId, req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await invService.listInvoices(req.user!.userId, req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function generateCurrentInvoice(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await invService.generateCurrentInvoice(req.user!.userId, req.user!.agencyId);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await invService.getInvoice(id, req.user!.userId, req.user!.agencyId);
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
    const result = await invService.downloadInvoicePdf(id, req.user!.userId, req.user!.agencyId);
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
    const result = await compService.listComplaints(req.user!.userId, req.user!.agencyId);
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
    const result = await compService.createComplaint(
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
    const result = await profileService.listAddresses(req.user!.userId, req.user!.agencyId);
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
    const result = await profileService.createAddress(
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
        zoneId?: string;
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
    const result = await profileService.updateAddress(
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
        zoneId?: string | null;
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
    await profileService.deleteAddress(id, req.user!.userId, req.user!.agencyId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function getOnboardingStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await profileService.getOnboardingStatus(req.user!.userId, req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await profileService.getProfile(req.user!.userId, req.user!.agencyId);
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
    const result = await profileService.updateProfile(
      req.user!.userId,
      req.user!.agencyId,
      req.body as { firstName?: string; lastName?: string; email?: string | null }
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function initInvoicePayment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await invService.initInvoicePayment(req.user!.userId, req.user!.agencyId, id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function verifyInvoicePayment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await invService.verifyInvoicePayment(req.user!.userId, req.user!.agencyId, {
      invoiceId: id,
      ...(req.body as { orderId: string; paymentId: string; signature: string }),
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listNotifications(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { listNotifications } = await import('../../services/notification.service.js');
    const result = await listNotifications(req.user!.agencyId, req.user!.userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getUnreadNotificationCount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { getUnreadCount } = await import('../../services/notification.service.js');
    const result = await getUnreadCount(req.user!.agencyId, req.user!.userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listMyDistributionRequests(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await reqService.listMyDistributionRequests(
      req.user!.userId,
      req.user!.agencyId
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function createMyDistributionRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await reqService.createMyDistributionRequest(
      req.user!.userId,
      req.user!.agencyId,
      req.body as {
        title: string;
        description?: string;
        requestedQuantity: number;
        deliveryAddressId?: string;
        contactPerson?: string;
        contactPhone?: string;
        scheduledDate?: string;
        zones?: { deliveryZoneId: string; quantity: number }[];
      }
    );
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listMyArticleRequests(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await reqService.listMyArticleRequests(req.user!.userId, req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function estimateCart(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { items } = req.body as { items: { productId: string; startDate?: string }[] };
    const result = await cartService.estimateCart(req.user!.userId, req.user!.agencyId, items);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function checkoutCart(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { items, payment } = req.body as {
      items: { productId: string; startDate?: string }[];
      payment?: { method: 'CASH' | 'ONLINE'; transactionReference?: string };
    };
    const result = await cartService.checkoutCart(
      req.user!.userId,
      req.user!.agencyId,
      req.user!.userId,
      items,
      payment
    );
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listDeliveryZones(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { listDeliveryZones: getZones } =
      await import('../delivery-zone/delivery-zone.service.js');
    const result = await getZones(req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function createMyArticleRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await reqService.createMyArticleRequest(
      req.user!.userId,
      req.user!.agencyId,
      req.body as { productId?: string; title: string; content: string; publishInDate?: string }
    );
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
