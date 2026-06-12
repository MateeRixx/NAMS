import prisma from '@newsflow/database';
import app from './app.js';
import { config } from './config/index.js';

async function main() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');

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
