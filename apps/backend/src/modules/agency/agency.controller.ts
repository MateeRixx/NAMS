import { type Request, type Response, type NextFunction } from 'express';
import { NotFoundError, UserRole } from '@newsflow/shared';
import * as agencyService from './agency.service.js';

export async function createAgency(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await agencyService.createAgency(req.body as never);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getAgency(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params['id']!;

    if (req.user!.role !== UserRole.SUPER_ADMIN && req.user!.agencyId !== id) {
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

    if (req.user!.role !== UserRole.SUPER_ADMIN && req.user!.agencyId !== id) {
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

export async function listAgencies(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await agencyService.listAgencies();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
