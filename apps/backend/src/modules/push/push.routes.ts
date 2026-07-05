import { Router } from 'express';
import { customerAuth } from '../../middleware/customerAuth.js';
import { validate } from '../../middleware/validation.js';
import { subscribeSchema } from './push.validator.js';
import * as pushController from './push.controller.js';

const router = Router();

router.get('/vapid-public-key', pushController.getVapidPublicKey);
router.post('/subscribe', customerAuth, validate(subscribeSchema), pushController.subscribe);
router.post('/unsubscribe', customerAuth, pushController.unsubscribe);

export default router;
