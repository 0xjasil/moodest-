import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface StandardApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, any>
{
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((res) => {
        // If the handler returned an array, preserve it directly for array-expecting callers
        if (Array.isArray(res)) {
          return res;
        }

        // Already adheres to the strict success contract (with or without additional properties)
        if (
          res &&
          typeof res === 'object' &&
          res.success === true &&
          'message' in res &&
          'data' in res
        ) {
          return res;
        }

        let message = '';
        let data = res;

        if (res && typeof res === 'object') {
          if ('message' in res && 'data' in res) {
            message = res.message || '';
            data = res.data;
          } else if ('message' in res && Object.keys(res).length === 1) {
            message = res.message || '';
            data = {};
          }
        }

        return {
          success: true,
          message: message || '',
          data: data ?? {},
        };
      }),
    );
  }
}
