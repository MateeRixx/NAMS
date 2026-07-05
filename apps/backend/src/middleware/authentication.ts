import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticationError, UserRole } from '@newsflow/shared';
import type { JwtPayload } from '@newsflow/shared';
import prisma from '@newsflow/database';
import { config } from '../config/index.js';

function mapRole(role: string): UserRole {
  if (Object.values(UserRole).includes(role as UserRole)) {
    return role as UserRole;
  }
  return UserRole.CUSTOMER;
}

export async function authentication(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.slice(7);
    const payload = jwt.verify(token, config.JWT_SECRET) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    if (!user.isActive) {
      throw new AuthenticationError('Account is disabled');
    }

    req.user = {
      userId: user.id,
      agencyId: user.agencyId,
      role: mapRole(user.role),
    };

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      next(error);
    } else {
      next(new AuthenticationError('Invalid token'));
    }
  }
}
