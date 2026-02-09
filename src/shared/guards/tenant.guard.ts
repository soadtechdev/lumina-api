import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { RoleUser } from '@shared/schemas/user.schema';
import { IUserDataJWT } from '@shared/interfaces/decodeJWT';

@Injectable()
export class TenantGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: IUserDataJWT = request.user;

    // Si es Super Admin, no necesita tenantId
    if (user?.role === RoleUser.SUPER_ADMIN) {
      request['tenantId'] = null;
      return true;
    }

    // Para otros usuarios, tenantId es obligatorio
    const tenantId = user?.tenantId || request.headers['x-tenant-id'];

    if (!tenantId) {
      throw new UnauthorizedException('Tenant not identified');
    }

    request['tenantId'] = tenantId;
    return true;
  }
}
