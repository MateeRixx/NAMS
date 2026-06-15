import { type Request, type Response, type NextFunction } from 'express';
import * as notificationService from './notification.service.js';

export async function listNotifications(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await notificationService.listNotifications(
      req.user!.agencyId,
      req.user!.role === 'CUSTOMER' ? req.user!.userId : undefined
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getUnreadCount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await notificationService.getUnreadCount(
      req.user!.agencyId,
      req.user!.role === 'CUSTOMER' ? req.user!.userId : undefined
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
