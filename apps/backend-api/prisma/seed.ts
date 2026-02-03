import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Seeding database...');

  // Create test users
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'test@example.com',
      stripeCustomerId: null,
    },
  });

  const proUser = await prisma.user.upsert({
    where: { email: 'pro@example.com' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'pro@example.com',
      stripeCustomerId: 'cus_test_pro_123',
    },
  });

  console.log('Created users:', { testUser, proUser });

  // Create test licenses
  const freeLicense = await prisma.license.upsert({
    where: { licenseKey: 'SPLICE-TEST-FREE-0001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000101',
      userId: testUser.id,
      licenseKey: 'SPLICE-TEST-FREE-0001',
      plan: 'free',
      status: 'active',
      activatedAt: new Date(),
      expiresAt: null,
    },
  });

  const proLicense = await prisma.license.upsert({
    where: { licenseKey: 'SPLICE-TEST-PRO0-0001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000102',
      userId: proUser.id,
      licenseKey: 'SPLICE-TEST-PRO0-0001',
      plan: 'pro',
      status: 'active',
      activatedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    },
  });

  const expiredLicense = await prisma.license.upsert({
    where: { licenseKey: 'SPLICE-TEST-EXPD-0001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000103',
      userId: testUser.id,
      licenseKey: 'SPLICE-TEST-EXPD-0001',
      plan: 'pro',
      status: 'expired',
      activatedAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000), // 400 days ago
      expiresAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 days ago
    },
  });

  console.log('Created licenses:', { freeLicense, proLicense, expiredLicense });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
