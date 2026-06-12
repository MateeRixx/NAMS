import { Router } from 'express';
import { UserRole } from '@newsflow/shared';
import { authentication } from '../../middleware/authentication.js';
import { authorize } from '../../middleware/authorization.js';
import { validate } from '../../middleware/validation.js';
import { createComplaintSchema, updateComplaintStatusSchema } from './complaint.validator.js';
import * as complaintController from './complaint.controller.js';

const router = Router();

router.use(authentication);

router.post(
  '/',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  validate(createComplaintSchema),
  complaintController.createComplaint
);
router.get(
  '/',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  complaintController.listComplaints
);
router.get(
  '/:id',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  complaintController.getComplaint
);
router.patch(
  '/:id/status',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  validate(updateComplaintStatusSchema),
  complaintController.updateComplaintStatus
);
router.get(
  '/:id/history',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  complaintController.getComplaintHistory
);

export default router;
