import { LoggerService, LogLevel } from '@nestjs/common';
import * as winston from 'winston';

const { combine, timestamp, json, printf, colorize } = winston.format;

const developmentFormat = printf(({ level, message, timestamp: ts, context, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
  return `${ts as string} [${level}] [${(context as string) ?? 'App'}] ${message as string} ${metaStr}`;
});

const productionFormat = combine(
  timestamp(),
  json(),
);

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  developmentFormat,
);

export class WinstonLogger implements LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';

    this.logger = winston.createLogger({
      level: isProduction ? 'info' : 'debug',
      format: isProduction ? productionFormat : devFormat,
      transports: [
        new winston.transports.Console(),
      ],
    });
  }

  log(message: string, context?: string): void {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string): void {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string): void {
    this.logger.verbose(message, { context });
  }

  setLogLevels(_levels: LogLevel[]): void {
    // Not implemented - uses Winston configuration
  }
}

export const createLogger = (): WinstonLogger => new WinstonLogger();
