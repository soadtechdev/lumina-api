import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Estrategia 1: Desde JWT (después del login)
    const tenantFromJWT = req['user']?.tenantId;

    // Estrategia 2: Desde header (útil para testing)
    const tenantFromHeader = req.headers['x-tenant-id'] as string;

    // Estrategia 3: Desde subdomain (greenvalley.lumina.com)
    // const subdomain = req.hostname.split('.')[0];
    // const tenantFromSubdomain = await this.getTenantBySlug(subdomain);

    const tenantId = tenantFromJWT || tenantFromHeader;

    if (!tenantId) {
      throw new UnauthorizedException('Tenant not identified');
    }

    // Inyectar tenantId en el request
    req['tenantId'] = tenantId;
    next();
  }
}
