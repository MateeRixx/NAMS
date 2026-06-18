import { Router } from 'express';
import { UserRole } from '@newsflow/shared';
import { authentication } from '../../middleware/authentication.js';
import { authorize } from '../../middleware/authorization.js';
import { validate } from '../../middleware/validation.js';
import { recordPaymentSchema, processRefundSchema, retryPaymentSchema, initOnlinePaymentSchema, saveGatewayConfigSchema } from './payment.validator.js';
import * as paymentController from './payment.controller.js';

const router = Router();

router.post('/webhook/:agencyId', paymentController.handleWebhook);

router.use(authentication);

router.post(
  '/record',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  validate(recordPaymentSchema),
  paymentController.recordPayment
);

router.post(
  '/init-online',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  validate(initOnlinePaymentSchema),
  paymentController.initOnlinePayment
);

router.post(
  '/verify',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  paymentController.verifyOnlinePayment
);

router.post(
  '/refund',
  authorize(UserRole.AGENCY_ADMIN),
  validate(processRefundSchema),
  paymentController.processRefund
);

router.post(
  '/:paymentId/retry',
  authorize(UserRole.AGENCY_ADMIN),
  paymentController.retryPayment
);

router.post(
  '/retry-all-failed',
  authorize(UserRole.AGENCY_ADMIN),
  paymentController.retryAllFailedPayments
);

router.get(
  '/',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  paymentController.listPayments
);

router.get(
  '/invoice/:invoiceId',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  paymentController.getInvoicePayments
);

router.get(
  '/refunds',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  paymentController.listRefunds
);

router.get(
  '/refunds/:id',
  authorize(UserRole.AGENCY_ADMIN),
  paymentController.getRefund
);

router.get(
  '/gateway-config',
  authorize(UserRole.AGENCY_ADMIN),
  paymentController.getGatewayConfig
);

router.put(
  '/gateway-config',
  authorize(UserRole.AGENCY_ADMIN),
  validate(saveGatewayConfigSchema),
  paymentController.saveGatewayConfig
);

router.get(
  '/:id',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  paymentController.getPayment
);

export default router;
