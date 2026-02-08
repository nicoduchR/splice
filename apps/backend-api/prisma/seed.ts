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

  // Create AppRelease seed data for update system testing
  const release100 = await prisma.appRelease.upsert({
    where: { version: '1.0.0' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000201',
      version: '1.0.0',
      releaseDate: new Date('2026-01-01T00:00:00Z'),
      releaseNotes: 'Initial release of Splicely.\n\n- Video import and proxy generation\n- AI-powered transcription\n- Smart cut detection',
      isMandatory: false,
    },
  });

  const release110 = await prisma.appRelease.upsert({
    where: { version: '1.1.0' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000202',
      version: '1.1.0',
      releaseDate: new Date('2026-01-15T00:00:00Z'),
      releaseNotes: 'Bug fixes and performance improvements.\n\n- Fixed audio sync issues\n- Improved export speed\n- Better error handling',
      isMandatory: false,
    },
  });

  const release200 = await prisma.appRelease.upsert({
    where: { version: '2.0.0' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000203',
      version: '2.0.0',
      releaseDate: new Date('2026-02-01T00:00:00Z'),
      releaseNotes: 'Major update with new features.\n\n- Multi-track editing\n- Batch export\n- Critical security patch',
      isMandatory: true,
    },
  });

  console.log('Created app releases:', { release100, release110, release200 });

  // Create PlatformRelease entries for each release/platform combination
  const platforms = ['darwin-aarch64', 'darwin-x86_64', 'windows-x86_64'] as const;
  const releases = [
    { release: release100, version: '1.0.0' },
    { release: release110, version: '1.1.0' },
    { release: release200, version: '2.0.0' },
  ];

  for (const { release, version } of releases) {
    for (const platform of platforms) {
      const ext = platform.startsWith('windows') ? '.zip' : '.tar.gz';
      await prisma.platformRelease.upsert({
        where: {
          releaseId_platform: {
            releaseId: release.id,
            platform,
          },
        },
        update: {},
        create: {
          id: `${release.id.slice(0, -3)}${platform === 'darwin-aarch64' ? '01' : platform === 'darwin-x86_64' ? '02' : '03'}${version.replace(/\./g, '')}`,
          releaseId: release.id,
          platform,
          downloadUrl: `https://updates.splicely.app/v${version}/${platform}/Splicely${ext}`,
          signature: `ed25519:seed-sig-${version}-${platform}`,
        },
      });
    }
  }

  console.log('Created platform releases for all versions and platforms');

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
