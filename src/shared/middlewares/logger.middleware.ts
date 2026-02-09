// logger.middleware.ts
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: () => void) {
    const { method, originalUrl, ip, headers } = req;
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;

      /*this.logger.log(
        `IP: ${ip} - method: ${method} - url: ${originalUrl} - status: ${statusCode} - duration: ${duration}ms`,
      );*/
      // this.logger.debug(`Headers: ${JSON.stringify(headers)}`);
    });

    next();
  }
}
