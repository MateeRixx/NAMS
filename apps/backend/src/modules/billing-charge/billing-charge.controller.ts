import { type Request, type Response, type NextFunction } from 'express';
import * as billingChargeService from './billing-charge.service.js';

export async function createCharge(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await billingChargeService.createCharge(req.body as never, req.user!.agencyId);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getCharge(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await billingChargeService.getCharge(id, req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function updateCharge(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await billingChargeService.updateCharge(
      id,
      req.body as never,
      req.user!.agencyId
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listCharges(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await billingChargeService.listCharges(_req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function deleteCharge(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params['id']!;
    await billingChargeService.deleteCharge(id, req.user!.agencyId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
