import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class StandardResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        return {
          success: true,
          data: data ?? {},
          statusCode: context.switchToHttp().getResponse().statusCode,
          timestamp: new Date().toISOString(),
          path: context.switchToHttp().getRequest<Request>().url,
        };
      }),
    );
  }
}
