import { type Request, type Response, type NextFunction } from 'express';
import { AuthenticationError } from '@newsflow/shared';

export function tenantResolver(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new AuthenticationError('User not authenticated'));
    return;
  }

  next();
}
