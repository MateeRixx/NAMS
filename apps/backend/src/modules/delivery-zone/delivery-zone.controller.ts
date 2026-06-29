import { type Request, type Response, type NextFunction } from 'express';
import * as deliveryZoneService from './delivery-zone.service.js';

export async function createDeliveryZone(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await deliveryZoneService.createDeliveryZone(
      req.body as never,
      req.user!.agencyId
    );
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getDeliveryZone(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await deliveryZoneService.getDeliveryZone(id, req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function updateDeliveryZone(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await deliveryZoneService.updateDeliveryZone(
      id,
      req.body as never,
      req.user!.agencyId
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listDeliveryZones(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await deliveryZoneService.listDeliveryZones(_req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function deleteDeliveryZone(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params['id']!;
    await deliveryZoneService.deleteDeliveryZone(id, req.user!.agencyId);
    res.json({ success: true, data: { message: 'Delivery zone deleted' } });
  } catch (error) {
    next(error);
  }
}
