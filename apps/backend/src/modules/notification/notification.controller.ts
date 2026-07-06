import { type Request, type Response, type NextFunction } from 'express';
import * as notificationService from './notification.service.js';

export async function listNotifications(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const limit = req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : 50;
    const offset = req.query['offset'] ? parseInt(req.query['offset'] as string, 10) : 0;
    const channel = req.query['channel'] as string | undefined;
    const area = req.query['area'] as string | undefined;
    const zoneId = req.query['zoneId'] as string | undefined;
    const result = await notificationService.listNotifications(
      req.user!.agencyId,
      req.user!.role === 'CUSTOMER' ? req.user!.userId : undefined,
      { limit, offset, channel, area, zoneId }
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

export async function sendNotification(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await notificationService.sendNotification({
      agencyId: req.user!.agencyId,
      ...req.body,
    });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
