import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import RegisterUserDto from '@shared/dtos/auth/registerUser.dto';
import ValidateOtpDto from '@shared/dtos/auth/validateOtp.dto';
import { DateTime } from 'luxon';
import { generateJWTToken } from '@shared/utils/generateJWT';
import { generateOTP } from '@shared/utils/generateOTP';
import CreatePasswordUserDto from '@shared/dtos/auth/createPasswordUser.dto';
import { validatePassword } from '@shared/utils/hashPassword';
import RegenerateOtpDto from '@shared/dtos/auth/regenerateOtp.dto';
import LoginDto from '@shared/dtos/auth/login.dto';
import { IUserDataJWT } from '@shared/interfaces/decodeJWT';
import { RegisterStep } from '@shared/schemas/user.schema';
import ResendProvider, { emailType } from '@shared/providers/resend.provider';
import RecoveryPasswordRequestDto from '@shared/dtos/auth/recoveryPasswordRequest.dto';
import ChangePasswordDto from '@shared/dtos/auth/changePassword.dto';
import { GoogleUserDto } from '@shared/dtos/auth/googleUser.dto';
import { HttpService } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import * as jwt from 'jsonwebtoken';

const jwksClient = require('jwks-rsa');

import constants from '../../contants';
import { UsersService } from '../users/users.service';

const client = new OAuth2Client(constants.GOOGLE_CLIENT_ID);
const clientApple = jwksClient({
  jwksUri: 'https://appleid.apple.com/auth/keys',
});

@ApiTags('auth')
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly resendProvider: ResendProvider,
    private httpService: HttpService,
  ) {}

  async registerUser(registerUser: RegisterUserDto) {
    try {
      const newUser = await this.usersService.create(registerUser);

      return newUser;
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }

  async validateOTP(validateOtpDto: ValidateOtpDto) {
    try {
      const user = await this.usersService.getUserByEmail(validateOtpDto?.email);

      if (!user) {
        throw new HttpException('USER NOT FOUND', HttpStatus.FORBIDDEN);
      }

      if (DateTime.fromISO(user?.otpExpire?.toISOString()) < DateTime.now()) {
        throw new HttpException('OTP EXPIRED, REQUEST ANOTHER ONE', HttpStatus.BAD_REQUEST);
      }

      if (validateOtpDto?.otpCode !== user?.otpCode) {
        throw new HttpException('OTP INVALID', HttpStatus.BAD_REQUEST);
      }

      await this.usersService.update(user?._id?.toString(), {
        otpCode: null,
        otpExpire: null,
        step: RegisterStep.OTP_VERIFIED,
      });

      const jwtToken = generateJWTToken(
        {
          id: user?._id?.toString(),
        },
        null,
        '5m',
      );

      return {
        user,
        token: jwtToken,
      };
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }

  async regenerateOtp(regenerateOtpDto: RegenerateOtpDto) {
    try {
      const user = await this.usersService.getUserByEmail(regenerateOtpDto?.email);

      if (!user) {
        throw new HttpException('USER NOT FOUND', HttpStatus.FORBIDDEN);
      }
      const otpCode = generateOTP();
      const updateUser = await this.usersService.update(user?._id?.toString(), {
        otpCode,
        otpExpire: DateTime.now().plus({ minutes: 5 }).toUTC().toJSDate(),
      });

      this.resendProvider.sendTemplateEmail({
        type: emailType.CODE_VERIFICATION,
        email: updateUser.email,
        subject: 'Código de verificación de tu cuenta Splittier',
        param: {
          code: otpCode,
        },
      });

      return updateUser;
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }

  async createPasswordUser(
    createPasswordUserDto: CreatePasswordUserDto,
    requestUser: IUserDataJWT,
  ) {
    try {
      const user = await this.usersService.getUserByEmail(createPasswordUserDto?.email);

      if (!user) {
        throw new HttpException('USER NOT FOUND', HttpStatus.FORBIDDEN);
      }

      if (requestUser?.id !== user?._id?.toString()) {
        throw new HttpException('USER NOT ALLOWED FOR CREATE PASSWORD', HttpStatus.FORBIDDEN);
      }

      const userWithPassword = await this.usersService.update(user?._id?.toString(), {
        password: createPasswordUserDto?.password,
        step: RegisterStep.PASSWORD_CREATED,
      });

      const jwtToken = generateJWTToken({
        id: user?._id?.toString(),
      });

      return {
        user: userWithPassword,
        token: jwtToken,
      };
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const user = await this.usersService.getUserByEmail(loginDto?.email);

      if (!user || !user?.isActive) {
        throw new HttpException('USER NOT FOUND', HttpStatus.UNAUTHORIZED);
      }
      const comparePassword = await validatePassword(loginDto?.password, user?.password);

      if (!comparePassword) {
        throw new HttpException('USER INVALID', HttpStatus.UNAUTHORIZED);
      }
      const token = generateJWTToken({
        id: user?._id?.toString(),
      });

      return {
        user,
        token: token,
      };
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }

  async recoveryPasswordRequest(recoveryPasswordRequestDto: RecoveryPasswordRequestDto) {
    try {
      const otpCode = generateOTP();

      const user = await this.usersService.getUserByEmail(recoveryPasswordRequestDto?.email);

      await this.usersService.update(user?._id?.toString(), {
        otpCode,
        otpExpire: DateTime.now().plus({ minutes: 5 }).toUTC().toJSDate(),
      });

      this.resendProvider.sendTemplateEmail({
        type: emailType.CODE_VERIFICATION,
        email: recoveryPasswordRequestDto.email,
        subject: 'Código recuperacion de cuenta en Splittier',
        param: {
          code: otpCode,
        },
      });
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }

  async changePassword(changePasswordDto: ChangePasswordDto) {
    try {
      const user = await this.usersService.getUserByEmail(changePasswordDto?.email);

      if (changePasswordDto?.otpCode !== user?.otpCode) {
        throw new HttpException('OTP INVALID', HttpStatus.BAD_REQUEST);
      }

      if (DateTime.fromISO(user?.otpExpire?.toISOString()) < DateTime.now()) {
        throw new HttpException('OTP EXPIRED, REQUEST ANOTHER ONE', HttpStatus.BAD_REQUEST);
      }

      if (changePasswordDto?.otpCode !== user?.otpCode) {
        throw new HttpException('OTP INVALID', HttpStatus.BAD_REQUEST);
      }

      await this.usersService.update(user?._id?.toString(), {
        otpCode: null,
        otpExpire: null,
      });

      const userWithPassword = await this.usersService.update(user?._id?.toString(), {
        password: changePasswordDto?.password,
      });

      const jwtToken = generateJWTToken({
        id: user?._id?.toString(),
      });

      return {
        user: userWithPassword,
        token: jwtToken,
      };
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * [EXTERNAL PLATFORMS LOGIN]
   * */
  async verifyToken(token: string) {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: constants.GOOGLE_CLIENT_ID,
    });

    return ticket.getPayload();
  }

  async loginWithGoogleId(googleUserDto: GoogleUserDto) {
    try {
      const userInfo = await this.verifyToken(googleUserDto.idToken);

      let user: any = await this.usersService.getUserByEmailWithoutValidation(userInfo.email);

      if (!user) {
        user = await this.usersService.create(
          {
            email: userInfo.email,
            firstName: userInfo.given_name ?? '',
          },
          false,
        );
      }

      const token = generateJWTToken({
        id: user?._id?.toString(),
      });

      return {
        user: user,
        token,
      };
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }
  getAppleKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
    clientApple.getSigningKey(header.kid, (err, key) => {
      if (err) {
        callback(err);
      } else {
        const signingKey = key.getPublicKey();

        callback(null, signingKey);
      }
    });
  }
  async verifyAppleToken(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.getAppleKey, { algorithms: ['RS256'] }, (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      });
    });
  }
  async loginWithApple(appleUserDto: GoogleUserDto) {
    try {
      const userInfo = await this.verifyAppleToken(appleUserDto.idToken);
      let user: any = await this.usersService.getUserByEmailWithoutValidation(userInfo.email);

      if (!user) {
        user = await this.usersService.create(
          {
            email: userInfo.email,
            firstName: userInfo.given_name ?? '',
          },
          false,
        );
      }

      const token = generateJWTToken({
        id: user?._id?.toString(),
      });

      return {
        user: user,
        token,
      };
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }
}
