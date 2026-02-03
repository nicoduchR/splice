export const ErrorCodes = {
  // License errors
  LICENSE_NOT_FOUND: 'LICENSE_NOT_FOUND',
  LICENSE_INVALID: 'LICENSE_INVALID',
  LICENSE_EXPIRED: 'LICENSE_EXPIRED',
  LICENSE_ALREADY_ACTIVATED: 'LICENSE_ALREADY_ACTIVATED',

  // Stripe errors
  STRIPE_WEBHOOK_INVALID: 'STRIPE_WEBHOOK_INVALID',
  STRIPE_CUSTOMER_NOT_FOUND: 'STRIPE_CUSTOMER_NOT_FOUND',
  STRIPE_SUBSCRIPTION_NOT_FOUND: 'STRIPE_SUBSCRIPTION_NOT_FOUND',

  // General errors
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

interface ErrorDefinition {
  code: ErrorCode;
  message: string;
  httpStatus: number;
}

const ERROR_DEFINITIONS: Record<ErrorCode, Omit<ErrorDefinition, 'code'>> = {
  [ErrorCodes.LICENSE_NOT_FOUND]: {
    message: 'The provided license key does not exist',
    httpStatus: 404,
  },
  [ErrorCodes.LICENSE_INVALID]: {
    message: 'The provided license key is invalid or has been revoked',
    httpStatus: 401,
  },
  [ErrorCodes.LICENSE_EXPIRED]: {
    message: 'The license has expired',
    httpStatus: 401,
  },
  [ErrorCodes.LICENSE_ALREADY_ACTIVATED]: {
    message: 'This license has already been activated',
    httpStatus: 409,
  },
  [ErrorCodes.STRIPE_WEBHOOK_INVALID]: {
    message: 'Invalid webhook signature',
    httpStatus: 400,
  },
  [ErrorCodes.STRIPE_CUSTOMER_NOT_FOUND]: {
    message: 'Stripe customer not found',
    httpStatus: 404,
  },
  [ErrorCodes.STRIPE_SUBSCRIPTION_NOT_FOUND]: {
    message: 'Stripe subscription not found',
    httpStatus: 404,
  },
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: {
    message: 'Too many requests. Please try again later',
    httpStatus: 429,
  },
  [ErrorCodes.UNAUTHORIZED]: {
    message: 'Unauthorized. Invalid or missing API key',
    httpStatus: 401,
  },
  [ErrorCodes.VALIDATION_ERROR]: {
    message: 'Request validation failed',
    httpStatus: 400,
  },
  [ErrorCodes.INTERNAL_ERROR]: {
    message: 'An internal error occurred',
    httpStatus: 500,
  },
};

export function createError(code: ErrorCode): ErrorDefinition {
  const definition = ERROR_DEFINITIONS[code];
  return {
    code,
    ...definition,
  };
}

export class DomainError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly httpStatus: number,
    message?: string,
  ) {
    super(message ?? ERROR_DEFINITIONS[code].message);
    this.name = 'DomainError';
  }

  static fromCode(code: ErrorCode): DomainError {
    const definition = ERROR_DEFINITIONS[code];
    return new DomainError(code, definition.httpStatus, definition.message);
  }
}
