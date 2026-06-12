import { Router } from 'express';
import { UserRole } from '@newsflow/shared';
import { authentication } from '../../middleware/authentication.js';
import { authorize } from '../../middleware/authorization.js';
import { validate } from '../../middleware/validation.js';
import { createSubscriptionSchema, pauseSubscriptionSchema } from './subscription.validator.js';
import * as subscriptionController from './subscription.controller.js';

const router = Router();

router.use(authentication);

router.post(
  '/',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  validate(createSubscriptionSchema),
  subscriptionController.createSubscription
);
router.get(
  '/',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  subscriptionController.listSubscriptions
);
router.get(
  '/:id',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  subscriptionController.getSubscription
);
router.patch(
  '/:id/cancel',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  subscriptionController.cancelSubscription
);
router.patch(
  '/:id/pause',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  validate(pauseSubscriptionSchema),
  subscriptionController.pauseSubscription
);
router.patch(
  '/:id/resume',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  subscriptionController.resumeSubscription
);
router.get(
  '/:id/pauses',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  subscriptionController.getPauseHistory
);

export default router;
