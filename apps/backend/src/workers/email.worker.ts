import { Worker } from 'bullmq';
import type { Redis } from 'ioredis';
import { sendEmailNotification } from '../services/notification.service.js';

export function startEmailWorker(connection: Redis): Worker {
  const worker = new Worker(
    'email',
    async (job) => {
      const { notificationId, emailTo, emailSubject, type, title, message, templateData } =
        job.data as {
          notificationId: string;
          emailTo?: string;
          emailSubject?: string;
          type: string;
          title: string;
          message: string;
          templateData?: Record<string, string>;
        };

      await sendEmailNotification(notificationId, {
        emailTo,
        emailSubject,
        type: type as never,
        title,
        message,
        templateData,
      });
    },
    { connection, concurrency: 5 }
  );

  worker.on('completed', (job) => {
    console.log(`[EmailWorker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[EmailWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
