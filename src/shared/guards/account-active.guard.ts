import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AccountStatus } from '@shared/schemas/user.schema';
import { IUserDataJWT } from '@shared/interfaces/decodeJWT';

import { UsersService } from '../../modules/users/users.service';

@Injectable()
export class AccountActiveGuard implements CanActivate {
  constructor(private usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: IUserDataJWT = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Validar que la cuenta esté ACTIVE
    if (user.accountStatus !== AccountStatus.ACTIVE) {
      throw new ForbiddenException('Account is not active. Please complete your registration.');
    }

    return true;
  }

  // por si la primera llega a fallar, esta es mas rigurosa
  /*async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const tenantId = request.user?.tenantId;

    if (!userId || !tenantId) {
      throw new ForbiddenException('User not authenticated');
    }

    const user = await this.usersService.getUserById(userId, tenantId);

    if (user.accountStatus !== AccountStatus.ACTIVE) {
      throw new ForbiddenException('Account is not active');
    }

    return true;
  }*/
}
