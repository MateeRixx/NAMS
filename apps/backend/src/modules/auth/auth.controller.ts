import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import * as authService from './auth.service.js';
import { config } from '../../config/index.js';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.register(req.body as never);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.login(req.body as never);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await authService.sendOtp((req.body as { phone: string }).phone);
    res.json({ success: true, data: { message: 'OTP sent successfully' } });
  } catch (error) {
    next(error);
  }
}

export async function sendEmailOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await authService.sendEmailOtp((req.body as { email: string }).email);
    res.json({ success: true, data: { message: 'OTP sent to email' } });
  } catch (error) {
    next(error);
  }
}

export async function verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as { phone: string; otp: string };
    const result = await authService.verifyOtp(body.phone, body.otp);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function customerRegister(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.customerRegister(req.body as never);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function customerVerifyEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = req.body as { email: string; otp: string };
    const result = await authService.customerVerifyEmail(body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function customerLogin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.customerLogin(req.body as never);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export function resetPassword(_req: Request, res: Response): void {
  res.json({ success: true, data: { message: 'Password reset email sent if account exists' } });
}

export async function customerForgotPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.customerForgotPassword(req.body as never);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function customerResetPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.customerResetPassword(req.body as never);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await authService.getProfile(req.user!.userId);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
}

export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await authService.listUsersByAgency(req.user!.agencyId);
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await authService.getProfile(req.user!.userId);

    const token = jwt.sign(
      { userId: profile.id, agencyId: profile.agencyId, role: profile.role },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN } as jwt.SignOptions
    );

    res.json({
      success: true,
      data: {
        token,
        user: profile,
      },
    });
  } catch (error) {
    next(error);
  }
}
