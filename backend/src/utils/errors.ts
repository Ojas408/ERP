/**
 * Operational error with an associated HTTP status code.
 *
 * "Operational" errors are expected, recoverable conditions (bad input, missing
 * resource, conflict, etc.) whose message is safe to send to the client. They are
 * distinguished from unexpected programmer/infrastructure errors, whose details
 * must never leak to clients in production.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export const badRequest = (message = 'Bad request') => new AppError(message, 400);
export const unauthorized = (message = 'Authentication required') => new AppError(message, 401);
export const forbidden = (message = 'Forbidden') => new AppError(message, 403);
export const notFound = (message = 'Resource not found') => new AppError(message, 404);
export const conflict = (message = 'Conflict') => new AppError(message, 409);
