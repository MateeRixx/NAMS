import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AuthenticationError, ConflictError, NotFoundError, UserRole, type JwtPayload } from '@newsflow/shared';
import type { CustomerRegisterDto, CustomerVerifyEmailDto, CustomerLoginDto, CustomerForgotPasswordDto, CustomerResetPasswordDto } from './auth.types.js';
import prisma from '@newsflow/database';
import { config } from '../../config/index.js';
import { getRedis } from '../../config/redis.js';
import * as authRepository from './auth.repository.js';
import * as customerRepository from '../customer/customer.repository.js';
import { sendEmail } from '../../services/email.service.js';
import type {
  RegisterDto,
  LoginDto,
  AuthResponse,
  UserProfileResponse,
  CustomerAuthResponse,
} from './auth.types.js';

function mapRole(role: string): UserRole {
  if (Object.values(UserRole).includes(role as UserRole)) {
    return role as UserRole;
  }
  return UserRole.CUSTOMER;
}

function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export async function register(dto: RegisterDto): Promise<AuthResponse> {
  const existingUser = await authRepository.findUserByFirebaseUid(dto.firebaseUid);
  if (existingUser) {
    throw new ConflictError('User already registered with this Firebase account');
  }

  if (dto.email) {
    const emailUser = await authRepository.findUserByEmail(dto.email);
    if (emailUser) {
      throw new ConflictError('Email already in use');
    }
  }

  if (dto.phone) {
    const phoneUser = await authRepository.findUserByPhone(dto.phone);
    if (phoneUser) {
      throw new ConflictError('Phone already in use');
    }
  }

  const user = await authRepository.createUser({
    email: dto.email,
    phone: dto.phone,
    firebaseUid: dto.firebaseUid,
    firstName: dto.firstName,
    lastName: dto.lastName,
    role: UserRole.AGENCY_STAFF,
    agencyId: dto.agencyId,
  });

  const token = generateToken({
    userId: user.id,
    agencyId: user.agencyId,
    role: mapRole(user.role),
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      role: mapRole(user.role),
      agencyId: user.agencyId,
    },
  };
}

export async function login(dto: LoginDto): Promise<AuthResponse> {
  let user;
  if (dto.email) {
    user = await authRepository.findUserByEmail(dto.email);
  } else if (dto.phone) {
    user = await authRepository.findUserByPhone(dto.phone);
  }

  if (!user) {
    throw new NotFoundError('User');
  }

  if (!user.isActive) {
    throw new AuthenticationError('Account is disabled');
  }

  if (dto.password) {
    if (!user.password) {
      throw new AuthenticationError('This account has no password set. Contact an administrator.');
    }
    if (!(await bcrypt.compare(dto.password, user.password))) {
      throw new AuthenticationError('Invalid email or password');
    }
  }

  const token = generateToken({
    userId: user.id,
    agencyId: user.agencyId,
    role: mapRole(user.role),
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      role: mapRole(user.role),
      agencyId: user.agencyId,
    },
  };
}

export async function sendOtp(phone: string): Promise<void> {
  const redis = getRedis();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await redis.set(`otp:${phone}`, otp, 'EX', 300);
  await redis.publish('otp', JSON.stringify({ phone, otp }));

  console.log(`[DEV] OTP for ${phone}: ${otp}`);
}

export async function sendEmailOtp(email: string): Promise<void> {
  const redis = getRedis();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await redis.set(`otp:email:${email}`, otp, 'EX', 300);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a56db;">NewsFlow Verification</h2>
      <p>Your OTP for signup is:</p>
      <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px; margin: 16px 0;">
        ${otp}
      </div>
      <p>This OTP is valid for <strong>5 minutes</strong>.</p>
      <p style="color: #6b7280; font-size: 13px;">If you did not request this, please ignore this email.</p>
    </div>
  `;

  await sendEmail({ to: email, subject: 'Your NewsFlow OTP', html });
  console.log(`[DEV] Email OTP for ${email}: ${otp}`);
}

export async function verifyOtp(phone: string, otp: string): Promise<AuthResponse> {
  const redis = getRedis();
  const storedOtp = await redis.get(`otp:${phone}`);

  if (!storedOtp || storedOtp !== otp) {
    throw new AuthenticationError('Invalid or expired OTP');
  }

  await redis.del(`otp:${phone}`);

  const user = await authRepository.findUserByPhone(phone);
  if (!user) {
    throw new NotFoundError('User');
  }

  if (!user.isActive) {
    throw new AuthenticationError('Account is disabled');
  }

  const token = generateToken({
    userId: user.id,
    agencyId: user.agencyId,
    role: mapRole(user.role),
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      role: mapRole(user.role),
      agencyId: user.agencyId,
    },
  };
}

export async function customerRegister(dto: CustomerRegisterDto): Promise<{ message: string }> {
  const agency = await prisma.agency.findFirst();
  if (!agency) {
    throw new NotFoundError('Agency');
  }

  const existing = await customerRepository.findCustomerByEmail(dto.email, agency.id);
  if (existing) {
    throw new ConflictError('Customer with this email already exists');
  }

  const passwordHash = await bcrypt.hash(dto.password, 10);
  const customerCode = await customerRepository.getNextCustomerCode(agency.id);

  await prisma.customer.create({
    data: {
      agencyId: agency.id,
      customerCode,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone ?? null,
      email: dto.email,
      password: passwordHash,
      status: 'ACTIVE',
    },
  });

  const redis = getRedis();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await redis.set(`otp:email:${dto.email}`, otp, 'EX', 300);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a56db;">NewsFlow Verification</h2>
      <p>Your OTP for email verification is:</p>
      <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px; margin: 16px 0;">
        ${otp}
      </div>
      <p>This OTP is valid for <strong>5 minutes</strong>.</p>
      <p style="color: #6b7280; font-size: 13px;">If you did not request this, please ignore this email.</p>
    </div>
  `;

  await sendEmail({ to: dto.email, subject: 'Verify your NewsFlow email', html });
  console.log(`[DEV] Email OTP for ${dto.email}: ${otp}`);

  return { message: 'Account created. Please check your email for the verification OTP.' };
}

export async function customerVerifyEmail(dto: CustomerVerifyEmailDto): Promise<CustomerAuthResponse> {
  const redis = getRedis();
  const storedOtp = await redis.get(`otp:email:${dto.email}`);

  if (!storedOtp || storedOtp !== dto.otp) {
    throw new AuthenticationError('Invalid or expired OTP');
  }

  await redis.del(`otp:email:${dto.email}`);

  const agency = await prisma.agency.findFirst();
  const customer = agency ? await customerRepository.findCustomerByEmail(dto.email, agency.id) : null;

  if (!customer) {
    throw new NotFoundError('Customer');
  }

  await prisma.customer.update({
    where: { id: customer.id },
    data: { emailVerifiedAt: new Date() },
  });

  const token = generateToken({
    userId: customer.id,
    agencyId: customer.agencyId,
    role: UserRole.CUSTOMER,
  });

  return {
    token,
    user: {
      id: customer.id,
      customerCode: customer.customerCode,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      email: customer.email,
      agencyId: customer.agencyId,
    },
  };
}

export async function customerLogin(dto: CustomerLoginDto): Promise<CustomerAuthResponse> {
  const agency = await prisma.agency.findFirst();
  if (!agency) {
    throw new NotFoundError('Agency');
  }

  const customer = await customerRepository.findCustomerByEmail(dto.email, agency.id);
  if (!customer) {
    throw new AuthenticationError('Invalid email or password');
  }

  if (!customer.password) {
    throw new AuthenticationError('This account was created without a password. Please reset your password.');
  }

  if (!customer.emailVerifiedAt) {
    throw new AuthenticationError('Email not verified. Please check your email for the verification OTP.');
  }

  if (!(await bcrypt.compare(dto.password, customer.password))) {
    throw new AuthenticationError('Invalid email or password');
  }

  if (customer.status !== 'ACTIVE') {
    throw new AuthenticationError('Account is disabled');
  }

  const token = generateToken({
    userId: customer.id,
    agencyId: customer.agencyId,
    role: UserRole.CUSTOMER,
  });

  return {
    token,
    user: {
      id: customer.id,
      customerCode: customer.customerCode,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      email: customer.email,
      agencyId: customer.agencyId,
    },
  };
}

export async function customerForgotPassword(dto: CustomerForgotPasswordDto): Promise<{ message: string }> {
  const agency = await prisma.agency.findFirst();
  if (!agency) throw new NotFoundError('Agency');

  const customer = await customerRepository.findCustomerByEmail(dto.email, agency.id);
  if (!customer) {
    return { message: 'If an account with that email exists, an OTP has been sent.' };
  }

  const redis = getRedis();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await redis.set(`otp:reset:${dto.email}`, otp, 'EX', 300);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a56db;">NewsFlow Password Reset</h2>
      <p>Your OTP to reset your password is:</p>
      <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px; margin: 16px 0;">
        ${otp}
      </div>
      <p>This OTP is valid for <strong>5 minutes</strong>.</p>
      <p style="color: #6b7280; font-size: 13px;">If you did not request this, please ignore this email.</p>
    </div>
  `;

  await sendEmail({ to: dto.email, subject: 'Reset your NewsFlow password', html });
  console.log(`[DEV] Reset OTP for ${dto.email}: ${otp}`);

  return { message: 'If an account with that email exists, an OTP has been sent.' };
}

export async function customerResetPassword(dto: CustomerResetPasswordDto): Promise<{ message: string }> {
  const redis = getRedis();
  const storedOtp = await redis.get(`otp:reset:${dto.email}`);

  if (!storedOtp || storedOtp !== dto.otp) {
    throw new AuthenticationError('Invalid or expired OTP');
  }

  await redis.del(`otp:reset:${dto.email}`);

  const agency = await prisma.agency.findFirst();
  if (!agency) throw new NotFoundError('Agency');

  const customer = await customerRepository.findCustomerByEmail(dto.email, agency.id);
  if (!customer) {
    throw new NotFoundError('Customer');
  }

  const passwordHash = await bcrypt.hash(dto.password, 10);
  await prisma.customer.update({
    where: { id: customer.id },
    data: { password: passwordHash, emailVerifiedAt: customer.emailVerifiedAt ?? new Date() },
  });

  return { message: 'Password has been reset successfully. You can now login.' };
}

export async function listUsersByAgency(agencyId: string) {
  const users = await authRepository.findUsersByAgencyId(agencyId);
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    phone: u.phone,
    firstName: u.firstName,
    lastName: u.lastName,
    role: mapRole(u.role),
    isActive: u.isActive,
    createdAt: u.createdAt,
  }));
}

export async function getProfile(userId: string): Promise<UserProfileResponse> {
  const user = await authRepository.findUserById(userId);
  if (!user) {
    throw new NotFoundError('User');
  }

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
    role: mapRole(user.role),
    agencyId: user.agencyId,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}
