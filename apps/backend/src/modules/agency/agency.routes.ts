import { Router } from 'express';
import { UserRole } from '@newsflow/shared';
import { authentication } from '../../middleware/authentication.js';
import { authorize } from '../../middleware/authorization.js';
import { validate } from '../../middleware/validation.js';
import { updateAgencySchema, updateStatusSchema } from './agency.validator.js';
import * as agencyController from './agency.controller.js';

const router = Router();

router.use(authentication);

router.get('/:id', agencyController.getAgency);
router.patch(
  '/:id',
  authorize(UserRole.AGENCY_ADMIN),
  validate(updateAgencySchema),
  agencyController.updateAgency
);
router.patch(
  '/:id/status',
  authorize(UserRole.AGENCY_ADMIN),
  validate(updateStatusSchema),
  agencyController.updateAgencyStatus
);

export default router;
