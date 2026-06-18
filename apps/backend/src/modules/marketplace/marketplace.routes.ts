import { Router } from 'express';
import { UserRole } from '@newsflow/shared';
import { authentication } from '../../middleware/authentication.js';
import { authorize } from '../../middleware/authorization.js';
import { validate } from '../../middleware/validation.js';
import {
  createDistributionRequestSchema,
  updateDistributionRequestSchema,
  createArticleRequestSchema,
  updateArticleRequestSchema,
} from './marketplace.validator.js';
import * as marketplaceController from './marketplace.controller.js';

const router = Router();

router.use(authentication);

router.post(
  '/distribution-requests',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  validate(createDistributionRequestSchema),
  marketplaceController.createDistributionRequest
);
router.get(
  '/distribution-requests',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  marketplaceController.listDistributionRequests
);
router.get(
  '/distribution-requests/:id',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  marketplaceController.getDistributionRequest
);
router.patch(
  '/distribution-requests/:id',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  validate(updateDistributionRequestSchema),
  marketplaceController.updateDistributionRequest
);

router.post(
  '/article-requests',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  validate(createArticleRequestSchema),
  marketplaceController.createArticleRequest
);
router.get(
  '/article-requests',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  marketplaceController.listArticleRequests
);
router.get(
  '/article-requests/:id',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  marketplaceController.getArticleRequest
);
router.patch(
  '/article-requests/:id',
  authorize(UserRole.AGENCY_ADMIN, UserRole.AGENCY_STAFF),
  validate(updateArticleRequestSchema),
  marketplaceController.updateArticleRequest
);

export default router;
