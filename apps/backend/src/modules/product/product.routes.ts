import { Router } from 'express';
import { UserRole } from '@newsflow/shared';
import { authentication } from '../../middleware/authentication.js';
import { authorize } from '../../middleware/authorization.js';
import { validate } from '../../middleware/validation.js';
import {
  createProductSchema,
  updateProductSchema,
  createDayRateSchema,
  updateDayRateSchema,
} from './product.validator.js';
import * as productController from './product.controller.js';

const router = Router();

router.use(authentication);

router.post(
  '/',
  authorize(UserRole.AGENCY_ADMIN),
  validate(createProductSchema),
  productController.createProduct
);
router.get(
  '/',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  productController.listProducts
);
router.get(
  '/:id',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  productController.getProduct
);
router.patch(
  '/:id',
  authorize(UserRole.AGENCY_ADMIN),
  validate(updateProductSchema),
  productController.updateProduct
);
router.patch('/:id/activate', authorize(UserRole.AGENCY_ADMIN), productController.activateProduct);
router.patch(
  '/:id/deactivate',
  authorize(UserRole.AGENCY_ADMIN),
  productController.deactivateProduct
);

router.get(
  '/:productId/rates',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  productController.listDayRates
);
router.post(
  '/:productId/rates',
  authorize(UserRole.AGENCY_ADMIN),
  validate(createDayRateSchema),
  productController.upsertDayRate
);
router.patch(
  '/:productId/rates/:rateId',
  authorize(UserRole.AGENCY_ADMIN),
  validate(updateDayRateSchema),
  productController.updateDayRate
);
router.delete(
  '/:productId/rates/:rateId',
  authorize(UserRole.AGENCY_ADMIN),
  productController.deleteDayRate
);

export default router;
