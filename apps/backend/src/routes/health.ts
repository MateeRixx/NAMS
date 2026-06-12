import { Router } from 'express';
import prisma from '@newsflow/database';
import { checkRedisHealth } from '../config/redis.js';

const router = Router();

router.get('/health', async (_req, res) => {
  const checks = {
    database: false,
    redis: false,
    timestamp: new Date().toISOString(),
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (err) {
    console.error('Database health check failed:', err);
  }

  try {
    checks.redis = await checkRedisHealth();
  } catch (err) {
    console.error('Redis health check failed:', err);
  }

  const isHealthy = checks.database && checks.redis;

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    data: {
      status: isHealthy ? 'healthy' : 'degraded',
      checks,
    },
  });
});

export default router;
