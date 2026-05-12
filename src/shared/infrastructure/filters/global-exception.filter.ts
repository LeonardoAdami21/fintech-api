// src/shared/infrastructure/filters/global-exception.filter.ts
import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ThrottlerException } from '@nestjs/throttler';

interface ErrorResponse {
  statusCode: number;
  error:      string;
  message:    string | string[];
  timestamp:  string;
  path:       string;
  requestId?: string;
}

// Prisma error code → HTTP status mapping
const PRISMA_ERROR_MAP: Record<string, { status: number; message: string }> = {
  P2000: { status: 400, message: 'Input value too long for field' },
  P2001: { status: 404, message: 'Record not found' },
  P2002: { status: 409, message: 'Unique constraint violation — resource already exists' },
  P2003: { status: 409, message: 'Foreign key constraint violation' },
  P2004: { status: 409, message: 'Database constraint violation' },
  P2025: { status: 404, message: 'Record not found or operation failed' },
  P2034: { status: 409, message: 'Transaction conflict — please retry' },
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx  = host.switchToHttp();
    const req  = ctx.getRequest<Request>();
    const res  = ctx.getResponse<Response>();

    const errorResponse = this.buildErrorResponse(exception, req);

    // Log 5xx errors with stack trace
    if (errorResponse.statusCode >= 500) {
      this.logger.error(
        `[${errorResponse.statusCode}] ${req.method} ${req.url} — ${errorResponse.message}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`[${errorResponse.statusCode}] ${req.method} ${req.url} — ${errorResponse.message}`);
    }

    res.status(errorResponse.statusCode).json(errorResponse);
  }

  private buildErrorResponse(exception: unknown, req: Request): ErrorResponse {
    const timestamp = new Date().toISOString();
    const path      = req.url;

    // ── NestJS HTTP exceptions ──────────────────────────────────────────────
    if (exception instanceof HttpException) {
      const status   = exception.getStatus();
      const response = exception.getResponse();
      const message  = typeof response === 'object' && 'message' in (response as object)
        ? (response as any).message
        : exception.message;

      return {
        statusCode: status,
        error:      HttpStatus[status] ?? 'Error',
        message,
        timestamp,
        path,
      };
    }

    // ── Prisma known errors ─────────────────────────────────────────────────
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const mapped = PRISMA_ERROR_MAP[exception.code];
      const status  = mapped?.status ?? 400;
      const message = mapped?.message ?? `Database error ${exception.code}`;

      // Enrich unique violation with field name
      const finalMessage = exception.code === 'P2002' && exception.meta?.target
        ? `${String((exception.meta.target as string[]).join(', '))} already in use`
        : message;

      return { statusCode: status, error: HttpStatus[status] ?? 'Database Error', message: finalMessage, timestamp, path };
    }

    // ── Prisma validation errors ────────────────────────────────────────────
    if (exception instanceof Prisma.PrismaClientValidationError) {
      return { statusCode: 400, error: 'Bad Request', message: 'Invalid database input', timestamp, path };
    }

    // ── Rate limiter ────────────────────────────────────────────────────────
    if (exception instanceof ThrottlerException) {
      return { statusCode: 429, error: 'Too Many Requests', message: 'Rate limit exceeded — slow down', timestamp, path };
    }

    // ── Unknown / unhandled errors ──────────────────────────────────────────
    return {
      statusCode: 500,
      error:      'Internal Server Error',
      message:    'An unexpected error occurred',
      timestamp,
      path,
    };
  }
}
