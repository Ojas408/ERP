import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/errors';

const isProd = (process.env.NODE_ENV || 'development') === 'production';

interface ResolvedError {
  statusCode: number;
  message: string;
  isOperational: boolean;
}

/**
 * Translate a thrown value into an HTTP status code and a client-safe message.
 * Known/operational errors keep their message; everything else is treated as an
 * unexpected server error so internal details are never leaked to clients.
 */
function resolveError(err: unknown): ResolvedError {
  if (err instanceof AppError) {
    return { statusCode: err.statusCode, message: err.message, isOperational: err.isOperational };
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2025': // Record required by the operation was not found
        return { statusCode: 404, message: 'Resource not found', isOperational: true };
      case 'P2002': // Unique constraint violation
        return { statusCode: 409, message: 'A record with these details already exists', isOperational: true };
      case 'P2003': // Foreign key constraint violation
        return { statusCode: 400, message: 'Related record does not exist', isOperational: true };
      case 'P2000': // Value too long for column
        return { statusCode: 400, message: 'One or more values are invalid', isOperational: true };
      default:
        return { statusCode: 400, message: 'Database request failed', isOperational: true };
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return { statusCode: 400, message: 'Invalid request data', isOperational: true };
  }

  // Body-parser JSON parse failures surface as SyntaxError with these markers.
  if (err instanceof SyntaxError && 'body' in err) {
    return { statusCode: 400, message: 'Malformed JSON in request body', isOperational: true };
  }

  const status = typeof (err as { status?: unknown })?.status === 'number'
    ? (err as { status: number }).status
    : 500;
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  return { statusCode: status, message, isOperational: status < 500 };
}

/**
 * Centralized Express error handler. Ensures every error reaching it is logged
 * server-side (so nothing is silently swallowed) and returns a consistent JSON
 * response with an appropriate status code.
 */
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  const { statusCode, message, isOperational } = resolveError(err);

  // Always log the full error with request context so failures are never silent.
  const logContext = `${req.method} ${req.originalUrl} -> ${statusCode}`;
  if (statusCode >= 500 || !isOperational) {
    console.error(`[error] ${logContext}`, err instanceof Error ? err.stack || err.message : err);
  } else {
    console.warn(`[warn] ${logContext}: ${message}`);
  }

  // Headers already sent (e.g. mid-stream failure): delegate to Express's
  // default handler so it closes the connection properly.
  if (res.headersSent) {
    return next(err);
  }

  // Never leak internal error details to clients for unexpected server errors.
  const clientMessage = statusCode >= 500 && isProd ? 'Internal Server Error' : message;

  res.status(statusCode).json({
    message: clientMessage,
    ...(!isProd && statusCode >= 500 && { error: err instanceof Error ? err.message : String(err) }),
  });
}

/** Fallback handler for requests that match no route. */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ message: `Not found: ${req.method} ${req.originalUrl}` });
}
