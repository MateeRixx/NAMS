import { type Request, type Response, type NextFunction } from 'express';
import * as pushService from '../../services/push.service.js';

export async function getVapidPublicKey(_req: Request, res: Response): Promise<void> {
  res.json({ success: true, data: { publicKey: pushService.getVapidPublicKey() } });
}

export async function subscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { endpoint, keys } = req.body as { endpoint: string; keys: { p256dh: string; auth: string } };
    const ua = req.headers['user-agent'];
    await pushService.subscribe(req.user!.userId, { endpoint, keys }, ua);
    res.json({ success: true, data: { message: 'Subscribed' } });
  } catch (error) {
    next(error);
  }
}

export async function unsubscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { endpoint } = req.body as { endpoint: string };
    await pushService.unsubscribe(req.user!.userId, endpoint);
    res.json({ success: true, data: { message: 'Unsubscribed' } });
  } catch (error) {
    next(error);
  }
}
