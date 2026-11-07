import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;
    // Log path only, never query strings
    const pathOnly = request.baseUrl || request.path || (request.url ? request.url.split('?')[0] : '');
    const now = Date.now();

    // Logs ONLY HTTP method, sanitized path, and duration.
    // NEVER logs request body, query strings, Authorization headers, tokens, or cookies.
    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        this.logger.log(`[${method}] ${pathOnly} +${responseTime}ms`);
      }),
    );
  }
}
