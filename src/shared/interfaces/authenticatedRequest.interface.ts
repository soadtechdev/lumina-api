import { IUserDataJWT } from './decodeJWT';

export default interface AuthenticatedRequest extends Request {
  user?: IUserDataJWT;
}
