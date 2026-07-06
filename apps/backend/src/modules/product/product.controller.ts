import { type Request, type Response, type NextFunction } from 'express';
import * as productService from './product.service.js';

export async function createProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await productService.createProduct(req.body as never, req.user!.agencyId);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await productService.getProduct(id, req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await productService.updateProduct(
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

export async function activateProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await productService.activateProduct(id, req.user!.agencyId, req.user!.userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function deactivateProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await productService.deactivateProduct(id, req.user!.agencyId, req.user!.userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listProducts(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await productService.listProducts(_req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function upsertDayRate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const productId = req.params['productId']!;
    const result = await productService.upsertDayRate(
      productId,
      req.body as never,
      req.user!.agencyId
    );
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listDayRates(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const productId = req.params['productId']!;
    const result = await productService.listDayRates(productId, req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function updateDayRate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const productId = req.params['productId']!;
    const rateId = req.params['rateId']!;
    const result = await productService.updateDayRate(
      productId,
      rateId,
      req.body as never,
      req.user!.agencyId
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function deleteDayRate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const productId = req.params['productId']!;
    const rateId = req.params['rateId']!;
    await productService.deleteDayRate(productId, rateId, req.user!.agencyId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
