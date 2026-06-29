import { Router } from 'express';
import { authentication } from '../../middleware/authentication.js';
import { validate } from '../../middleware/validation.js';
import { sendNotificationSchema } from './notification.validator.js';
import * as notificationController from './notification.controller.js';

const router = Router();

router.use(authentication);

router.get('/', notificationController.listNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.post('/', validate(sendNotificationSchema), notificationController.sendNotification);

export default router;
