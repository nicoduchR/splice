import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainError, ErrorCodes, ErrorCode } from '@shared/errors/error-codes';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { status, errorResponse } = this.handleException(exception);

    response.status(status).json(errorResponse);
  }

  private handleException(exception: unknown): {
    status: number;
    errorResponse: ErrorResponse;
  } {
    // Handle domain errors
    if (exception instanceof DomainError) {
      return {
        status: exception.httpStatus,
        errorResponse: {
          success: false,
          error: {
            code: exception.code,
            message: exception.message,
          },
        },
      };
    }

    // Handle NestJS HTTP exceptions
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      let message = exception.message;
      let code: ErrorCode = ErrorCodes.INTERNAL_ERROR;

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = (responseObj.message as string) ?? message;

        // Map HTTP status to error code
        if (status === HttpStatus.UNAUTHORIZED) {
          code = ErrorCodes.UNAUTHORIZED;
        } else if (status === HttpStatus.TOO_MANY_REQUESTS) {
          code = ErrorCodes.RATE_LIMIT_EXCEEDED;
        } else if (status === HttpStatus.BAD_REQUEST) {
          code = ErrorCodes.VALIDATION_ERROR;
        }
      }

      return {
        status,
        errorResponse: {
          success: false,
          error: {
            code,
            message: Array.isArray(message) ? message.join(', ') : message,
          },
        },
      };
    }

    // Handle unexpected errors
    this.logger.error('Unexpected error:', exception);

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      errorResponse: {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'An unexpected error occurred',
        },
      },
    };
  }
}
