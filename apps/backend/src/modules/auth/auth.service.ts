import jwt from 'jsonwebtoken';
import { ConflictError, NotFoundError, UserRole, type JwtPayload } from '@newsflow/shared';
import { config } from '../../config/index.js';
import { getRedis } from '../../config/redis.js';
import * as authRepository from './auth.repository.js';
import type { RegisterDto, LoginDto, AuthResponse, UserProfileResponse } from './auth.types.js';

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
    throw new Error('Account is disabled');
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

export async function verifyOtp(phone: string, otp: string): Promise<AuthResponse> {
  const redis = getRedis();
  const storedOtp = await redis.get(`otp:${phone}`);

  if (!storedOtp || storedOtp !== otp) {
    throw new Error('Invalid or expired OTP');
  }

  await redis.del(`otp:${phone}`);

  const user = await authRepository.findUserByPhone(phone);
  if (!user) {
    throw new NotFoundError('User');
  }

  if (!user.isActive) {
    throw new Error('Account is disabled');
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
