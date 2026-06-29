import { z } from 'zod';

export const sendNotificationSchema = z.object({
  customerId: z.string().uuid().optional(),
  channel: z.enum(['EMAIL', 'WHATSAPP', 'PUSH']),
  title: z.string().min(1),
  message: z.string().min(1),
});
