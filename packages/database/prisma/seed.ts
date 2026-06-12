import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existingAgency = await prisma.agency.findFirst({ where: { email: 'dev@newsflow.local' } });
  if (existingAgency) {
    console.log('Seed data already exists, skipping...');
    return;
  }

  const agency = await prisma.agency.create({
    data: {
      name: 'Dev Agency',
      email: 'dev@newsflow.local',
      phone: '+919999999999',
      status: 'ACTIVE',
    },
  });

  const user = await prisma.user.create({
    data: {
      agencyId: agency.id,
      email: 'admin@newsflow.local',
      firebaseUid: 'dev-firebase-uid',
      firstName: 'Dev',
      lastName: 'Admin',
      role: 'AGENCY_ADMIN',
      isActive: true,
    },
  });

  console.log(`Seed created: Agency ${agency.id}, User ${user.id}`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
