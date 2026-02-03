import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from '@infrastructure/filters/api-exception.filter';
import { LoggingInterceptor } from '@infrastructure/interceptors/logging.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    rawBody: true, // Required for Stripe webhook signature verification
  });

  const logger = new Logger('Bootstrap');

  // Global prefix for all routes
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new ApiExceptionFilter());

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // CORS configuration for desktop app
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}/api/v1`);
  logger.log(`Health check available at: http://localhost:${port}/api/v1/health`);
}

void bootstrap();
