import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '@infrastructure/adapters/prisma/prisma.service';
import { LICENSE_REPOSITORY } from '@domain/ports/license.repository.port';
import { USER_REPOSITORY } from '@domain/ports/user.repository.port';
import { PAYMENT_GATEWAY } from '@domain/ports/payment.gateway.port';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  const mockLicenseRepository = {
    findByKey: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockUserRepository = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByStripeCustomerId: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockPaymentGateway = {
    constructWebhookEvent: jest.fn(),
    getSubscription: jest.fn(),
    getCustomer: jest.fn(),
    getCheckoutSession: jest.fn(),
    cancelSubscription: jest.fn(),
  };

  const mockPrismaService = {
    healthCheck: jest.fn().mockResolvedValue(true),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(LICENSE_REPOSITORY)
      .useValue(mockLicenseRepository)
      .overrideProvider(USER_REPOSITORY)
      .useValue(mockUserRepository)
      .overrideProvider(PAYMENT_GATEWAY)
      .useValue(mockPaymentGateway)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/health (GET)', () => {
    it('should return health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('checks');
      expect(response.body.checks).toHaveProperty('database');
    });

    it('should return liveness status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health/live')
        .expect(200);

      expect(response.body).toEqual({ status: 'ok' });
    });

    it('should return readiness status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health/ready')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('ready');
    });
  });

  describe('/api/v1/license/verify (POST)', () => {
    it('should reject invalid license key format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/license/verify')
        .send({ licenseKey: 'invalid-key' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should require licenseKey field', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/license/verify')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('/api/v1/license/activate (POST)', () => {
    it('should reject invalid email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/license/activate')
        .send({
          licenseKey: 'SPLICE-ABCD-EFGH-IJKL',
          email: 'not-an-email',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should require both licenseKey and email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/license/activate')
        .send({ licenseKey: 'SPLICE-ABCD-EFGH-IJKL' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('/api/v1/analytics/event (POST)', () => {
    it('should accept analytics event (stub)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/analytics/event')
        .send({
          event: 'test_event',
          properties: { foo: 'bar' },
        })
        .expect(202);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Phase 2');
    });
  });
});
