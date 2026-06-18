import { Worker } from 'bullmq';
import type { Redis } from 'ioredis';
import prisma from '@newsflow/database';
import { getQueue } from '../config/queue.js';
import { sendWhatsApp, isWhatsAppConfigured } from '../services/whatsapp.service.js';

export function startNotificationWorker(connection: Redis): Worker {
  const worker = new Worker(
    'notifications',
    async (job) => {
      const { notificationId, channel, emailTo, emailSubject, type, title, message, templateData, customerId } =
        job.data as {
          notificationId: string;
          channel: string;
          emailTo?: string;
          emailSubject?: string;
          type: string;
          title: string;
          message: string;
          templateData?: Record<string, string>;
          customerId?: string;
          agencyId?: string;
        };

      if (channel === 'EMAIL') {
        const emailQueue = getQueue('email');
        await emailQueue.add(
          `email:${notificationId}`,
          {
            notificationId,
            emailTo,
            emailSubject,
            type,
            title,
            message,
            templateData,
          },
          { attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
        );
      } else if (channel === 'WHATSAPP') {
        if (!isWhatsAppConfigured()) {
          console.warn(`[NotificationWorker] WhatsApp not configured, marking ${notificationId} as SENT`);
          await prisma.notification.update({
            where: { id: notificationId },
            data: { status: 'SENT', sentAt: new Date() },
          });
          return;
        }

        let phone = templateData ? templateData['phone'] : undefined;

        if (!phone && customerId) {
          const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            select: { phone: true },
          });
          phone = customer?.phone ?? undefined;
        }

        if (!phone) {
          console.warn(`[NotificationWorker] No phone number for WhatsApp notification ${notificationId}`);
          await prisma.notification.update({
            where: { id: notificationId },
            data: { status: 'FAILED' },
          });
          return;
        }

        const result = await sendWhatsApp({ to: phone, message });

        if (result) {
          await prisma.notification.update({
            where: { id: notificationId },
            data: { status: 'SENT', sentAt: new Date() },
          });
        } else {
          await prisma.notification.update({
            where: { id: notificationId },
            data: { status: 'FAILED' },
          });
        }
      } else if (channel === 'PUSH') {
        console.log(`[NotificationWorker] PUSH channel not yet implemented`);
        await prisma.notification.update({
          where: { id: notificationId },
          data: { status: 'SENT', sentAt: new Date() },
        });
      }
    },
    { connection, concurrency: 10 }
  );

  worker.on('completed', (job) => {
    console.log(`[NotificationWorker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[NotificationWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
