import { type Request, type Response, type NextFunction } from 'express';
import * as marketplaceService from './marketplace.service.js';

export async function createDistributionRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await marketplaceService.createDistributionRequest(
      req.body as never,
      req.user!.agencyId
    );
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getDistributionRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await marketplaceService.getDistributionRequest(id, req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function updateDistributionRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await marketplaceService.updateDistributionRequest(
      id,
      req.body as never,
      req.user!.agencyId,
      req.user!.userId
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listDistributionRequests(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await marketplaceService.listDistributionRequests(_req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function createArticleRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await marketplaceService.createArticleRequest(
      req.body as never,
      req.user!.agencyId
    );
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getArticleRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await marketplaceService.getArticleRequest(id, req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function updateArticleRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await marketplaceService.updateArticleRequest(
      id,
      req.body as never,
      req.user!.agencyId,
      req.user!.userId
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listArticleRequests(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await marketplaceService.listArticleRequests(_req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
