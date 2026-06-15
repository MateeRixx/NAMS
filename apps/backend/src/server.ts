import prisma from '@newsflow/database';
import app from './app.js';
import { config } from './config/index.js';
import { startAllWorkers, stopAllWorkers } from './workers/index.js';
import { startScheduler, stopScheduler } from './services/scheduler.service.js';

async function main() {
  try {
    await prisma.$connect(); // eslint-disable-line @typescript-eslint/no-unsafe-call
    console.log('Database connected successfully');

    await startAllWorkers();
    console.log('Background workers started');

    startScheduler();

    app.listen(config.PORT, () => {
      console.log(`NewsFlow API running on http://localhost:${config.PORT}`);
      console.log(`Environment: ${config.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

function handleShutdown() {
  console.log('\nShutting down...');
  stopAllWorkers().catch(() => {});
  stopScheduler();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  prisma
    .$disconnect()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
