import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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

  const passwordHash = await bcrypt.hash('admin123', 10);

  const adminEmail = 'admin@newsflow.local';
  const existingAdmin = await prisma.user.findFirst({ where: { email: adminEmail } });
  if (existingAdmin) {
    if (!existingAdmin.password) {
      await prisma.user.update({ where: { id: existingAdmin.id }, data: { password: passwordHash } });
      console.log('Updated admin password');
    }
  } else {
    await prisma.user.create({
      data: {
        agencyId: agency.id,
        email: adminEmail,
        password: passwordHash,
        firstName: 'Dev',
        lastName: 'Admin',
        role: 'AGENCY_ADMIN',
        isActive: true,
      },
    });
    console.log('Created admin user');
  }

  const staffEmail = 'staff@newsflow.local';
  const existingStaff = await prisma.user.findFirst({ where: { email: staffEmail } });
  if (existingStaff) {
    if (!existingStaff.password) {
      await prisma.user.update({ where: { id: existingStaff.id }, data: { password: passwordHash } });
      console.log('Updated staff password');
    }
  } else {
    await prisma.user.create({
      data: {
        agencyId: agency.id,
        email: staffEmail,
        password: passwordHash,
        firstName: 'Dev',
        lastName: 'Staff',
        role: 'AGENCY_STAFF',
        isActive: true,
      },
    });
    console.log('Created staff user');
  }

  const customerPhone = '+919999999998';
  const existingCustomer = await prisma.customer.findFirst({ where: { phone: customerPhone, deletedAt: null } });
  if (!existingCustomer) {
    await prisma.customer.create({
      data: {
        agencyId: agency.id,
        customerCode: 'CUST-0001',
        firstName: 'Test',
        lastName: 'Customer',
        phone: customerPhone,
        email: 'customer@newsflow.local',
        status: 'ACTIVE',
      },
    });
    console.log('Created test customer');
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
