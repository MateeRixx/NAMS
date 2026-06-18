import { Router } from 'express';
import { UserRole } from '@newsflow/shared';
import { authentication } from '../../middleware/authentication.js';
import { authorize } from '../../middleware/authorization.js';
import * as auditController from './audit.controller.js';

const router = Router();

router.use(authentication);

router.get(
  '/',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  auditController.listAuditLogs
);
router.get(
  '/:id',
  authorize(UserRole.AGENCY_ADMIN),
  auditController.getAuditLog
);

export default router;
