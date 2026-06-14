import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  let agency = await prisma.agency.findFirst({ where: { email: 'dev@newsflow.local' } });

  if (!agency) {
    agency = await prisma.agency.create({
      data: {
        name: 'Dev Agency',
        email: 'dev@newsflow.local',
        phone: '+919999999999',
        status: 'ACTIVE',
      },
    });
  }

  const adminEmail = 'admin@newsflow.local';
  const existingAdmin = await prisma.user.findFirst({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const adminUser = await prisma.user.create({
      data: {
        agencyId: agency.id,
        email: adminEmail,
        firebaseUid: 'dev-firebase-uid',
        firstName: 'Dev',
        lastName: 'Admin',
        role: 'AGENCY_ADMIN',
        isActive: true,
      },
    });
    console.log(`Created admin user: ${adminUser.id}`);
  }

  const staffEmail = 'staff@newsflow.local';
  const existingStaff = await prisma.user.findFirst({ where: { email: staffEmail } });
  if (!existingStaff) {
    const staffUser = await prisma.user.create({
      data: {
        agencyId: agency.id,
        email: staffEmail,
        firebaseUid: 'dev-staff-uid',
        firstName: 'Dev',
        lastName: 'Staff',
        role: 'AGENCY_STAFF',
        isActive: true,
      },
    });
    console.log(`Created staff user: ${staffUser.id}`);
  }

  const customerPhone = '+919999999998';
  const existingCustomer = await prisma.customer.findFirst({ where: { phone: customerPhone, deletedAt: null } });
  if (!existingCustomer) {
    const testCustomer = await prisma.customer.create({
      data: {
        agencyId: agency.id,
        customerCode: 'CUST001',
        firstName: 'Test',
        lastName: 'Customer',
        phone: customerPhone,
        email: 'customer@newsflow.local',
        status: 'ACTIVE',
      },
    });
    console.log(`Created test customer: ${testCustomer.id}`);
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
