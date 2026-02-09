import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { RoleUser } from '@shared/schemas/user.schema';
import { IUserDataJWT } from '@shared/interfaces/decodeJWT';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: IUserDataJWT = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Validar que sea SUPER_ADMIN
    if (user.role !== RoleUser.SUPER_ADMIN) {
      throw new ForbiddenException('Only Super Admins can perform this action');
    }

    return true;
  }
}
