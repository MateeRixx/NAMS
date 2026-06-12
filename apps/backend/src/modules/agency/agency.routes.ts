import { Router } from 'express';
import { UserRole } from '@newsflow/shared';
import { authentication } from '../../middleware/authentication.js';
import { authorize } from '../../middleware/authorization.js';
import { validate } from '../../middleware/validation.js';
import { createAgencySchema, updateAgencySchema, updateStatusSchema } from './agency.validator.js';
import * as agencyController from './agency.controller.js';

const router = Router();

router.use(authentication);

router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN),
  validate(createAgencySchema),
  agencyController.createAgency
);
router.get('/', authorize(UserRole.SUPER_ADMIN), agencyController.listAgencies);
router.get('/:id', agencyController.getAgency);
router.patch('/:id', validate(updateAgencySchema), agencyController.updateAgency);
router.patch(
  '/:id/status',
  authorize(UserRole.SUPER_ADMIN),
  validate(updateStatusSchema),
  agencyController.updateAgencyStatus
);

export default router;
