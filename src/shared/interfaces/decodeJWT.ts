export interface IUserDataJWT {
  sub?: string;
  id?: string;
  tenantId?: string;
  role?: string;
  iat?: number;
  exp?: number;
}
