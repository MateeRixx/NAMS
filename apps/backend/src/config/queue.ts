import { Queue } from 'bullmq';
import { getRedis } from './redis.js';

const QUEUE_NAMES = [
  'invoice-generation',
  'invoice-pdf',
  'email',
  'whatsapp',
  'notifications',
  'sla-monitor',
  'analytics',
] as const;

type QueueName = (typeof QUEUE_NAMES)[number];

const queues = new Map<QueueName, Queue>();

export function getQueue(name: QueueName): Queue {
  if (!queues.has(name)) {
    const queue = new Queue(name, {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 7 * 24 * 3600,
          count: 1000,
        },
        removeOnFail: {
          age: 30 * 24 * 3600,
        },
      },
    });
    queues.set(name, queue);
  }
  return queues.get(name)!;
}

export async function closeQueues(): Promise<void> {
  for (const queue of queues.values()) {
    await queue.close();
  }
  queues.clear();
}

export type { QueueName };
