import { PrismaClient } from '@prisma/client';

const url = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5433/newsflow?schema=public&sslmode=disable';
const p = new PrismaClient({ datasources: { db: { url } } });

try {
  await p.$connect();
  console.log('DB OK');
  await p.$disconnect();
} catch (e) {
  console.error('Error:', e.message);
}
