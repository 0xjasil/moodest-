import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        if (Array.isArray(resObj.message)) {
          message = resObj.message.join(', ');
        } else if (resObj.message) {
          message = String(resObj.message);
        } else {
          message = exception.message;
        }

        if (resObj.error && typeof resObj.error === 'string') {
          code = resObj.error.toUpperCase().replace(/\s+/g, '_');
        } else if (resObj.code) {
          code = String(resObj.code);
        } else {
          code = HttpStatus[status] || 'HTTP_ERROR';
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    if (!code || code === 'INTERNAL_SERVER_ERROR') {
      code = HttpStatus[status] || 'INTERNAL_SERVER_ERROR';
    }

    // Log path only, never query strings.
    // 4xx client errors logged at WARN level, 5xx server errors logged at ERROR level.
    // NEVER log request body, query params, passwords, tokens, credentials, cookies, or Authorization headers.
    const pathOnly = request.path || (request.url ? request.url.split('?')[0] : '');
    const logMessage = `HTTP ${status} on ${request.method} ${pathOnly} - ${message}`;

    if (status >= 500) {
      this.logger.error(
        logMessage,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(logMessage);
    }

    response.status(status).json({
      success: false,
      message,
      error: {
        code,
      },
    });
  }
}
