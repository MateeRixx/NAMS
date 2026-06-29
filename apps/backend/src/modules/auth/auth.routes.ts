import { Router } from 'express';
import { UserRole } from '@newsflow/shared'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { authentication } from '../../middleware/authentication.js';
import { authorize } from '../../middleware/authorization.js'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { validate } from '../../middleware/validation.js';
import {
  registerSchema,
  loginSchema,
  sendOtpSchema,
  sendOtpEmailSchema,
  verifyOtpSchema,
  verifyEmailOtpSchema,
  resetPasswordSchema,
  customerRegisterSchema,
  customerLoginSchema,
  customerForgotPasswordSchema,
  customerResetPasswordSchema,
} from './auth.validator.js';
import * as authController from './auth.controller.js';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/otp/send', validate(sendOtpSchema), authController.sendOtp);
router.post('/otp/send-email', validate(sendOtpEmailSchema), authController.sendEmailOtp);
router.post('/otp/verify', validate(verifyOtpSchema), authController.verifyOtp);
router.post('/customer/register', validate(customerRegisterSchema), authController.customerRegister);
router.post('/customer/verify-email', validate(verifyEmailOtpSchema), authController.customerVerifyEmail);
router.post('/customer/login', validate(customerLoginSchema), authController.customerLogin);
router.post('/customer/forgot-password', validate(customerForgotPasswordSchema), authController.customerForgotPassword);
router.post('/customer/reset-password', validate(customerResetPasswordSchema), authController.customerResetPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.get('/me', authentication, authController.getProfile);
router.get('/users', authentication, authController.listUsers);
router.post('/refresh', authentication, authController.refreshToken);

export default router;
