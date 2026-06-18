import { Router } from 'express';
import { UserRole } from '@newsflow/shared';
import { authentication } from '../../middleware/authentication.js';
import { authorize } from '../../middleware/authorization.js';
import * as reportingController from './reporting.controller.js';

const router = Router();

router.use(authentication);

router.get(
  '/dashboard',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  reportingController.getDashboardStats
);
router.get(
  '/revenue',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  reportingController.getRevenueReport
);
router.get(
  '/products',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  reportingController.getProductReport
);
router.get(
  '/complaints',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  reportingController.getComplaintReport
);
router.get(
  '/growth',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  reportingController.getGrowthReport
);
router.get(
  '/collections',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  reportingController.getCollectionReport
);

export default router;
