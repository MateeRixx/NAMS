import type { Request, Response, NextFunction } from 'express';
import { checkRateLimit } from '../config/rateLimiter.js';

export async function rateLimiter(req: Request, res: Response, next: NextFunction): Promise<void> {
  const key = `${req.ip ?? req.socket.remoteAddress ?? 'unknown'}:${req.path}`;
  const maxRequests = req.method === 'POST' ? 30 : 60;
  const allowed = await checkRateLimit(key, maxRequests, 60);

  if (!allowed) {
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
      },
    });
    return;
  }

  next();
}
