import type { UserRole } from '@newsflow/shared';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        agencyId: string;
        role: UserRole;
        firebaseUid: string;
      };
    }
  }
}
