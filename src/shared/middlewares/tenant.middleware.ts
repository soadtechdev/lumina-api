import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RoleUser } from '@shared/schemas/user.schema';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const user = req['user'];

    // Si es Super Admin, no necesita tenantId
    if (user?.role === RoleUser.SUPER_ADMIN) {
      req['tenantId'] = null; // Super Admin es global

      return next();
    }

    // Para otros usuarios, tenantId es obligatorio
    const tenantFromJWT = user?.tenantId;
    const tenantFromHeader = req.headers['x-tenant-id'] as string;

    const tenantId = tenantFromJWT || tenantFromHeader;

    if (!tenantId) {
      throw new UnauthorizedException('Tenant not identified');
    }

    req['tenantId'] = tenantId;
    next();
  }
}
