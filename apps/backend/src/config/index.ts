import dotenv from 'dotenv';
import { resolve } from 'path';
import { z } from 'zod';

dotenv.config({ path: resolve('apps/backend/.env') });
dotenv.config({ path: resolve('.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  API_PREFIX: z.string().default('/api/v1'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('debug'),
  ADMIN_DASHBOARD_URL: z.string().default('http://localhost:3001'),
  MOBILE_APP_URL: z.string().default('http://localhost:3002'),

  EMAIL_FROM: z.string().default('onboarding@resend.dev'),
  EMAIL_PROVIDER: z.enum(['resend', 'smtp']).default('resend'),
  EMAIL_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),

  WHATSAPP_PROVIDER: z.enum(['twilio', 'none']).default('none'),
  WHATSAPP_ACCOUNT_SID: z.string().optional(),
  WHATSAPP_AUTH_TOKEN: z.string().optional(),
  WHATSAPP_FROM_NUMBER: z.string().optional(),

  FCM_SERVER_KEY: z.string().optional(),

  PAYMENT_PROVIDER: z.enum(['razorpay', 'mock']).default('mock'),
  PAYMENT_KEY_ID: z.string().optional(),
  PAYMENT_KEY_SECRET: z.string().optional(),
  PAYMENT_WEBHOOK_SECRET: z.string().optional(),
});

function validateConfig() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

export const config = validateConfig();

export type Config = z.infer<typeof envSchema>;
