import { type Request, type Response, type NextFunction } from 'express';
import { NotFoundError } from '@newsflow/shared';
import * as agencyService from './agency.service.js';

export async function getAgency(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params['id']!;

    if (req.user!.agencyId !== id) {
      throw new NotFoundError('Agency');
    }

    const result = await agencyService.getAgency(id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function updateAgency(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params['id']!;

    if (req.user!.agencyId !== id) {
      throw new NotFoundError('Agency');
    }

    const result = await agencyService.updateAgency(id, req.body as never);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function updateAgencyStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await agencyService.updateAgencyStatus(id, req.body as never);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
