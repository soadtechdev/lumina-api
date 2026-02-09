import { AccountStatus } from '@shared/schemas/user.schema';

export interface IUserDataJWT {
  sub?: string;
  id?: string;
  tenantId?: string;
  role?: string;
  accountStatus?: AccountStatus;
  iat?: number;
  exp?: number;
}
