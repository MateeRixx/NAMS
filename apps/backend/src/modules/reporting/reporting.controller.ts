import { type Request, type Response, type NextFunction } from 'express';
import * as reportingService from './reporting.service.js';

export async function getDashboardStats(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await reportingService.getDashboardStats(_req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getRevenueReport(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const filters = {
      year: req.query['year'] ? Number(req.query['year']) : undefined,
      month: req.query['month'] ? Number(req.query['month']) : undefined,
      productId: req.query['productId'] as string | undefined,
    };
    const result = await reportingService.getRevenueReport(req.user!.agencyId, filters);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getProductReport(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await reportingService.getProductReport(_req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getComplaintReport(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await reportingService.getComplaintReport(_req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getGrowthReport(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await reportingService.getGrowthReport(_req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getCollectionReport(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await reportingService.getCollectionReport(_req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
