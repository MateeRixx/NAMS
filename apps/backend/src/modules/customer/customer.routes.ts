import { Router } from 'express';
import { UserRole } from '@newsflow/shared';
import { authentication } from '../../middleware/authentication.js';
import { authorize } from '../../middleware/authorization.js';
import { validate } from '../../middleware/validation.js';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerQuerySchema,
  createAddressSchema,
  updateAddressSchema,
} from './customer.validator.js';
import * as customerController from './customer.controller.js';

const router = Router();

router.use(authentication);

router.post(
  '/',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  validate(createCustomerSchema),
  customerController.createCustomer
);
router.get(
  '/',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  validate(customerQuerySchema),
  customerController.listCustomers
);
router.get(
  '/:id',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  customerController.getCustomer
);
router.patch(
  '/:id',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  validate(updateCustomerSchema),
  customerController.updateCustomer
);
router.delete('/:id', authorize(UserRole.AGENCY_ADMIN), customerController.deleteCustomer);

router.get(
  '/:customerId/addresses',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  customerController.listAddresses
);
router.post(
  '/:customerId/addresses',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  validate(createAddressSchema),
  customerController.createAddress
);
router.patch(
  '/:customerId/addresses/:addressId',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  validate(updateAddressSchema),
  customerController.updateAddress
);
router.delete(
  '/:customerId/addresses/:addressId',
  authorize(UserRole.AGENCY_ADMIN),
  customerController.deleteAddress
);

export default router;
