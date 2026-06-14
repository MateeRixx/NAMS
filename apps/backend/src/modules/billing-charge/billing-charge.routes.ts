import { Router } from 'express';
import { UserRole } from '@newsflow/shared';
import { authentication } from '../../middleware/authentication.js';
import { authorize } from '../../middleware/authorization.js';
import { validate } from '../../middleware/validation.js';
import {
  createBillingChargeSchema,
  updateBillingChargeSchema,
} from './billing-charge.validator.js';
import * as billingChargeController from './billing-charge.controller.js';

const router = Router();

router.use(authentication);

router.post(
  '/',
  authorize(UserRole.AGENCY_ADMIN),
  validate(createBillingChargeSchema),
  billingChargeController.createCharge
);
router.get(
  '/',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  billingChargeController.listCharges
);
router.get(
  '/:id',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  billingChargeController.getCharge
);
router.patch(
  '/:id',
  authorize(UserRole.AGENCY_ADMIN),
  validate(updateBillingChargeSchema),
  billingChargeController.updateCharge
);
router.delete('/:id', authorize(UserRole.AGENCY_ADMIN), billingChargeController.deleteCharge);

export default router;
