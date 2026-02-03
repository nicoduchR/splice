import { Controller, Get, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '@infrastructure/adapters/prisma/prisma.service';

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: 'connected' | 'disconnected';
  };
}

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);
  private readonly startTime = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async check(): Promise<HealthCheckResponse> {
    const dbHealthy = await this.prisma.healthCheck();

    const response: HealthCheckResponse = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.0.1',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      checks: {
        database: dbHealthy ? 'connected' : 'disconnected',
      },
    };

    if (!dbHealthy) {
      this.logger.warn('Health check failed: Database disconnected');
    }

    return response;
  }

  @Get('live')
  @HttpCode(HttpStatus.OK)
  liveness(): { status: string } {
    return { status: 'ok' };
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  async readiness(): Promise<{ status: string; ready: boolean }> {
    const dbHealthy = await this.prisma.healthCheck();
    return {
      status: dbHealthy ? 'ok' : 'not ready',
      ready: dbHealthy,
    };
  }
}
