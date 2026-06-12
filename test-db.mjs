import { PrismaClient } from '@prisma/client';

const url = 'postgresql://postgres:postgres@localhost:5432/newsflow?schema=public&sslmode=disable';
const p = new PrismaClient({ datasources: { db: { url } } });

try {
  await p.$connect();
  console.log('DB OK');
  await p.$disconnect();
} catch (e) {
  console.error('Error:', e.message);
}
