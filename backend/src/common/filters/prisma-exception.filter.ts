import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database operation failed';
    let code = 'DATABASE_ERROR';

    switch (exception.code) {
      case 'P2002': {
        status = HttpStatus.CONFLICT;
        code = 'CONFLICT';
        const target = (exception.meta?.target as string[]) || 'field';
        message = `Unique constraint failed on: ${Array.isArray(target) ? target.join(', ') : target}`;
        break;
      }
      case 'P2025': {
        status = HttpStatus.NOT_FOUND;
        code = 'NOT_FOUND';
        message = 'Requested record was not found in the database';
        break;
      }
      case 'P2003': {
        status = HttpStatus.BAD_REQUEST;
        code = 'BAD_REQUEST';
        message = 'Foreign key constraint violation';
        break;
      }
      default:
        status = HttpStatus.BAD_REQUEST;
        code = 'BAD_REQUEST';
        message = `Database query error (${exception.code})`;
        break;
    }

    this.logger.error(
      `Prisma error [${exception.code}] on ${request.method} ${request.url}: ${message}`,
    );

    response.status(status).json({
      success: false,
      message,
      error: {
        code,
      },
    });
  }
}
