import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly apiKey: string;
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('API_KEY') ?? '';

    // Warn if API key is not configured
    if (!this.apiKey) {
      this.logger.warn('API_KEY is not configured - endpoints will require authentication');
    }
  }

  canActivate(context: ExecutionContext): boolean {
    // In development without API key, log warning but allow (for local testing only)
    if (!this.apiKey && this.configService.get<string>('NODE_ENV') === 'development') {
      this.logger.warn('API key authentication bypassed in development mode - DO NOT USE IN PRODUCTION');
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const providedKey = this.extractApiKey(request);

    if (!providedKey) {
      throw new UnauthorizedException('Missing API key');
    }

    if (providedKey !== this.apiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }

  private extractApiKey(request: Request): string | undefined {
    // Check X-API-Key header first
    const headerKey = request.headers['x-api-key'];
    if (headerKey) {
      return Array.isArray(headerKey) ? headerKey[0] : headerKey;
    }

    // Fallback to Authorization header with "Bearer" scheme
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check query parameter as last resort (not recommended for production)
    const queryKey = request.query.api_key;
    if (typeof queryKey === 'string') {
      return queryKey;
    }

    return undefined;
  }
}
