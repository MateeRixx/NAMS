import { Worker } from 'bullmq';
import type { Redis } from 'ioredis';
import prisma from '@newsflow/database';
import { getQueue } from '../config/queue.js';

export function startNotificationWorker(connection: Redis): Worker {
  const worker = new Worker(
    'notifications',
    async (job) => {
      const { notificationId, channel, emailTo, emailSubject, type, title, message, templateData } =
        job.data as {
          notificationId: string;
          channel: string;
          emailTo?: string;
          emailSubject?: string;
          type: string;
          title: string;
          message: string;
          templateData?: Record<string, string>;
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
      } else if (channel === 'WHATSAPP' || channel === 'PUSH') {
        console.log(`[NotificationWorker] ${channel} channel not yet implemented`);
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
