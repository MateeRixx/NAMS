import type { UserRole } from '@newsflow/shared';

export interface RegisterDto {
  email?: string;
  phone?: string;
  password: string;
  firstName: string;
  lastName: string;
  agencyId: string;
}

export interface LoginDto {
  email?: string;
  phone?: string;
  password?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    firstName: string;
    lastName: string;
    role: UserRole;
    agencyId: string;
  };
}

export interface SendOtpDto {
  phone: string;
}

export interface SendEmailOtpDto {
  email: string;
}

export interface VerifyOtpDto {
  phone: string;
  otp: string;
}

export interface VerifyEmailOtpDto {
  email: string;
  otp: string;
}

export interface ResetPasswordDto {
  email: string;
}

export interface CustomerRegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface CustomerVerifyEmailDto {
  email: string;
  otp: string;
}

export interface CustomerLoginDto {
  email: string;
  password: string;
}

export interface CustomerForgotPasswordDto {
  email: string;
}

export interface CustomerResetPasswordDto {
  email: string;
  otp: string;
  password: string;
}

export interface CustomerAuthResponse {
  token: string;
  user: {
    id: string;
    customerCode: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
    agencyId: string;
  };
}

export interface UserProfileResponse {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: UserRole;
  agencyId: string;
  isActive: boolean;
  createdAt: Date;
}
