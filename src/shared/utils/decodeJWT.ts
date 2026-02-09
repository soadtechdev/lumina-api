// LIBRARIES
import { UnauthorizedException } from '@nestjs/common';
import { verify } from 'jsonwebtoken';
// CONSTANTS
import constants from 'src/contants';

// UTILS
import { IUserDataJWT } from '../interfaces/decodeJWT';

export const decodeJWTToken = (jwtToken: string, customSecret?: string): IUserDataJWT => {
  try {
    if (!jwtToken) {
      throw new UnauthorizedException('UNAUTHORIZED');
    }

    // VALIDATE ENV
    if (!constants.JWT_SECRET) {
      throw new UnauthorizedException('INVALID_SECRET_JWT_KEY');
    }

    // DECODE TOKEN DATA
    const decodedToken = verify(
      jwtToken.replace('Bearer', '').trim(),
      customSecret || constants.JWT_SECRET,
    ) as IUserDataJWT;

    if (!decodedToken) {
      throw new UnauthorizedException('UNAUTHORIZED');
    }

    return decodedToken;
  } catch (error) {
    throw new UnauthorizedException('UNAUTHORIZED');
  }
};
