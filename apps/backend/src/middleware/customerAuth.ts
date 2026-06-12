import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '@newsflow/database';
import { AuthenticationError, UserRole } from '@newsflow/shared';
import type { JwtPayload } from '@newsflow/shared';
import { config } from '../config/index.js';

export async function customerAuth(
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

    const customer = await prisma.customer.findFirst({
      where: { id: payload.userId, agencyId: payload.agencyId, deletedAt: null },
    });

    if (!customer) {
      throw new AuthenticationError('Customer not found');
    }

    req.user = {
      userId: customer.id,
      agencyId: customer.agencyId,
      role: UserRole.CUSTOMER,
      firebaseUid: '',
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
