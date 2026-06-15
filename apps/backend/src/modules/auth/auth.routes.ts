import { Router } from 'express';
import { UserRole } from '@newsflow/shared'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { authentication } from '../../middleware/authentication.js';
import { authorize } from '../../middleware/authorization.js'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { validate } from '../../middleware/validation.js';
import {
  registerSchema,
  loginSchema,
  sendOtpSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  customerRegisterSchema,
} from './auth.validator.js';
import * as authController from './auth.controller.js';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/otp/send', validate(sendOtpSchema), authController.sendOtp);
router.post('/otp/verify', validate(verifyOtpSchema), authController.verifyOtp);
router.post('/customer/register', validate(customerRegisterSchema), authController.customerRegister);
router.post('/customer/otp/verify', validate(verifyOtpSchema), authController.customerVerifyOtp);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.get('/me', authentication, authController.getProfile);
router.get('/users', authentication, authController.listUsers);
router.post('/refresh', authentication, authController.refreshToken);

export default router;
