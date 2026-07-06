import type { Worker } from 'bullmq';
import { getRedis } from '../config/redis.js';
import { startNotificationWorker } from './notification.worker.js';
import { startEmailWorker } from './email.worker.js';

const activeWorkers: Worker[] = [];

export async function startAllWorkers(): Promise<void> {
  const connection = getRedis();

  const results = await Promise.allSettled([
    startNotificationWorker(connection),
    startEmailWorker(connection),
  ]);

  for (const result of results) {
    if (result.status === 'fulfilled') {
      activeWorkers.push(result.value);
    } else {
      console.error('[Workers] Failed to start worker:', result.reason);
    }
  }
}

export async function stopAllWorkers(): Promise<void> {
  await Promise.all(activeWorkers.map((w) => w.close()));
  activeWorkers.length = 0;
}
