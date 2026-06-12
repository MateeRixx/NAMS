import { Redis } from 'ioredis';
import { config } from './index.js';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: null,
      retryStrategy(times) {
        if (times > 5) return null;
        return Math.min(times * 200, 2000);
      },
    });

    redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
  }
  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

export async function checkRedisHealth(): Promise<boolean> {
  try {
    const r = getRedis();
    const result = await r.ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}
