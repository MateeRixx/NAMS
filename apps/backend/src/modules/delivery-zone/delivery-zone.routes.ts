import { Router } from 'express';
import { UserRole } from '@newsflow/shared';
import { authentication } from '../../middleware/authentication.js';
import { authorize } from '../../middleware/authorization.js';
import { validate } from '../../middleware/validation.js';
import { createDeliveryZoneSchema, updateDeliveryZoneSchema } from './delivery-zone.validator.js';
import * as deliveryZoneController from './delivery-zone.controller.js';

const router = Router();

router.use(authentication);

router.post(
  '/',
  authorize(UserRole.AGENCY_ADMIN),
  validate(createDeliveryZoneSchema),
  deliveryZoneController.createDeliveryZone
);
router.get(
  '/',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  deliveryZoneController.listDeliveryZones
);
router.get(
  '/:id',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  deliveryZoneController.getDeliveryZone
);
router.patch(
  '/:id',
  authorize(UserRole.AGENCY_ADMIN),
  validate(updateDeliveryZoneSchema),
  deliveryZoneController.updateDeliveryZone
);

export default router;
