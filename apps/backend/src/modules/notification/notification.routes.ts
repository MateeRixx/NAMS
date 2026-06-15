import { Router } from 'express';
import { authentication } from '../../middleware/authentication.js';
import * as notificationController from './notification.controller.js';

const router = Router();

router.use(authentication);

router.get('/', notificationController.listNotifications);
router.get('/unread-count', notificationController.getUnreadCount);

export default router;
