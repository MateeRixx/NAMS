import { type Request, type Response, type NextFunction } from 'express';
import * as subscriptionService from './subscription.service.js';

export async function createSubscription(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await subscriptionService.createSubscription(
      req.body as never,
      req.user!.agencyId
    );
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getSubscription(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await subscriptionService.getSubscription(id, req.user!.agencyId);
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
    const result = await subscriptionService.cancelSubscription(
      id,
      req.user!.agencyId,
      req.user!.userId
    );
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
    const result = await subscriptionService.pauseSubscription(
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

export async function resumeSubscription(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await subscriptionService.resumeSubscription(
      id,
      req.user!.agencyId,
      req.user!.userId
    );
    res.json({ success: true, data: result });
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
    const customerId = req.query['customerId'] as string | undefined;
    const result = await subscriptionService.listSubscriptions(req.user!.agencyId, customerId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getPauseHistory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params['id']!;
    const result = await subscriptionService.getPauseHistory(id, req.user!.agencyId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
