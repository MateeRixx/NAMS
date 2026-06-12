import { Router } from 'express';
import { UserRole } from '@newsflow/shared';
import { authentication } from '../../middleware/authentication.js';
import { authorize } from '../../middleware/authorization.js';
import { validate } from '../../middleware/validation.js';
import { generateInvoiceSchema } from './billing.validator.js';
import * as billingController from './billing.controller.js';

const router = Router();

router.use(authentication);

router.post(
  '/invoices/generate',
  authorize(UserRole.AGENCY_ADMIN),
  validate(generateInvoiceSchema),
  billingController.generateInvoice
);
router.get(
  '/invoices',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  billingController.listInvoices
);
router.get(
  '/invoices/:id',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  billingController.getInvoice
);
router.get(
  '/invoices/:id/pdf',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  billingController.downloadInvoicePdf
);

export default router;
