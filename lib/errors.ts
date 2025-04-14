export const AUTH_ERRORS = {
  // Clerk Authentication Errors
  CLERK: {
    UNAUTHORIZED: 'Unauthorized: Please sign in to access this resource',
    INVALID_TOKEN: 'Invalid authentication token',
    SESSION_EXPIRED: 'Your session has expired. Please sign in again',
    INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action',
    WEBHOOK_VERIFICATION: 'Invalid webhook signature',
    USER_NOT_FOUND: 'User not found',
    INVALID_REQUEST: 'Invalid request parameters',
  },

  // Supabase Database Errors
  SUPABASE: {
    CONNECTION_ERROR: 'Unable to connect to the database',
    QUERY_ERROR: 'Error executing database query',
    ROW_LEVEL_SECURITY: 'Access denied by row level security policy',
    FOREIGN_KEY_VIOLATION: 'Referenced record does not exist',
    UNIQUE_VIOLATION: 'Record already exists',
    NOT_FOUND: 'Record not found',
    INVALID_PARAMETERS: 'Invalid parameters provided',
    TRANSACTION_ERROR: 'Database transaction failed',
  },

  // HTTP Status Codes
  HTTP: {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },
} as const;

// Error Response Helper
export interface ErrorResponse {
  error: string;
  code: number;
  details?: unknown;
}

export const createErrorResponse = (
  message: string,
  code: number,
  details?: Record<string, unknown>,
): ErrorResponse => ({
  error: message,
  code,
  ...(details && { details }),
});

interface DatabaseError extends Record<string, unknown> {
  code?: string;
  message?: string;
  details?: unknown;
}

interface AuthError extends Record<string, unknown> {
  message?: string;
  code?: string;
  details?: unknown;
}

// Error Handler Helper
export const handleDatabaseError = (error: DatabaseError): ErrorResponse => {
  // Supabase specific error codes
  switch (error?.code) {
    case '23503': // Foreign key violation
      return createErrorResponse(
        AUTH_ERRORS.SUPABASE.FOREIGN_KEY_VIOLATION,
        AUTH_ERRORS.HTTP.BAD_REQUEST,
      );
    case '23505': // Unique violation
      return createErrorResponse(AUTH_ERRORS.SUPABASE.UNIQUE_VIOLATION, AUTH_ERRORS.HTTP.CONFLICT);
    case '42501': // RLS violation
      return createErrorResponse(
        AUTH_ERRORS.SUPABASE.ROW_LEVEL_SECURITY,
        AUTH_ERRORS.HTTP.FORBIDDEN,
      );
    default:
      return createErrorResponse(
        AUTH_ERRORS.SUPABASE.QUERY_ERROR,
        AUTH_ERRORS.HTTP.INTERNAL_SERVER_ERROR,
        error,
      );
  }
};

// Auth Error Handler Helper
export const handleAuthError = (error: AuthError): ErrorResponse => {
  if (error?.message?.includes('webhook')) {
    return createErrorResponse(
      AUTH_ERRORS.CLERK.WEBHOOK_VERIFICATION,
      AUTH_ERRORS.HTTP.UNAUTHORIZED,
    );
  }

  if (error?.message?.includes('token')) {
    return createErrorResponse(AUTH_ERRORS.CLERK.INVALID_TOKEN, AUTH_ERRORS.HTTP.UNAUTHORIZED);
  }

  return createErrorResponse(AUTH_ERRORS.CLERK.UNAUTHORIZED, AUTH_ERRORS.HTTP.UNAUTHORIZED, error);
};

export const ErrorTypes = {
  INITIALIZATION: 'INITIALIZATION_ERROR',
  ENVIRONMENT: 'ENVIRONMENT_ERROR',
  WEBHOOK_VERIFICATION: 'WEBHOOK_VERIFICATION_ERROR',
  USER_CREATION: 'USER_CREATION_ERROR',
  USER_DELETION: 'USER_DELETION_ERROR',
  DATABASE: 'DATABASE_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
} as const;

export type ErrorType = typeof ErrorTypes[keyof typeof ErrorTypes];
