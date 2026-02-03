import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ApplicationModule } from '@application/application.module';
import { InfrastructureModule } from '@infrastructure/infrastructure.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: parseInt(process.env.API_RATE_LIMIT_TTL ?? '60', 10) * 1000,
        limit: parseInt(process.env.API_RATE_LIMIT_LIMIT ?? '100', 10),
      },
    ]),

    // Clean Architecture layers (Domain is pure TS, no NestJS module needed)
    ApplicationModule,
    InfrastructureModule,
  ],
})
export class AppModule {}
