import { type Request, type Response, type NextFunction } from 'express';
import { AuthorizationError, ROLES_HIERARCHY, type UserRole } from '@newsflow/shared';

export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthorizationError('User not authenticated'));
      return;
    }

    const userRoleLevel = ROLES_HIERARCHY[req.user.role];
    if (userRoleLevel === undefined) {
      next(new AuthorizationError('Invalid user role'));
      return;
    }

    const hasAccess = allowedRoles.some((role) => {
      const allowedLevel = ROLES_HIERARCHY[role];
      return allowedLevel !== undefined && userRoleLevel >= allowedLevel;
    });

    if (!hasAccess) {
      next(new AuthorizationError('Insufficient permissions'));
      return;
    }

    next();
  };
}
