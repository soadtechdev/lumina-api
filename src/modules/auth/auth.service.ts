// src/modules/auth/auth.service.ts

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
import ResendProvider, { emailType } from '@shared/providers/resend.provider';
import RecoveryPasswordRequestDto from '@shared/dtos/auth/recoveryPasswordRequest.dto';
import ChangePasswordDto from '@shared/dtos/auth/changePassword.dto';
import { AccountStatus } from '@shared/schemas/user.schema';

import { UsersService } from '../users/users.service';

@ApiTags('auth')
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly resendProvider: ResendProvider,
  ) {}

  async registerUser(registerUser: RegisterUserDto, tenantId: string) {
    try {
      // Verificar si el email ya está registrado en este tenant
      const existingUser = await this.usersService.getUserByEmailWithoutValidation(
        registerUser.email,
        tenantId,
      );

      if (existingUser) {
        // Si ya existe pero no verificó, reenviar OTP
        if (existingUser.accountStatus === AccountStatus.PENDING_VERIFICATION) {
          const otpCode = generateOTP();

          await this.usersService.update(existingUser._id.toString(), tenantId, {
            otpCode,
            otpExpire: DateTime.now().plus({ minutes: 5 }).toUTC().toJSDate(),
          });

          await this.resendProvider.sendTemplateEmail({
            type: emailType.CODE_VERIFICATION,
            email: registerUser.email,
            subject: 'Código de verificación de tu cuenta Lumina',
            param: { code: otpCode },
          });

          return {
            message: 'OTP reenviado',
            user: existingUser,
          };
        }

        // Si ya está verificado o activo
        throw new HttpException('EMAIL_ALREADY_REGISTERED', HttpStatus.CONFLICT);
      }

      // Crear nuevo usuario
      const newUser = await this.usersService.create(registerUser, tenantId, true);

      return newUser;
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }

  async validateOTP(validateOtpDto: ValidateOtpDto) {
    try {
      // Buscar sin tenantId porque email es único globalmente
      const user = await this.usersService.getUserByEmail(validateOtpDto?.email);

      if (!user) {
        throw new HttpException('USER NOT FOUND', HttpStatus.FORBIDDEN);
      }

      // Validar que esté en estado PENDING_VERIFICATION
      if (user.accountStatus !== AccountStatus.PENDING_VERIFICATION) {
        throw new HttpException('ACCOUNT_ALREADY_VERIFIED', HttpStatus.BAD_REQUEST);
      }

      if (DateTime.fromISO(user?.otpExpire?.toISOString()) < DateTime.now()) {
        throw new HttpException('OTP EXPIRED, REQUEST ANOTHER ONE', HttpStatus.BAD_REQUEST);
      }

      if (validateOtpDto?.otpCode !== user?.otpCode) {
        throw new HttpException('OTP INVALID', HttpStatus.BAD_REQUEST);
      }

      // Cambiar estado a VERIFIED
      const verifiedUser = await this.usersService.update(
        user._id.toString(),
        user.tenantId.toString(),
        {
          otpCode: null,
          otpExpire: null,
          accountStatus: AccountStatus.VERIFIED,
        },
      );

      // JWT temporal para crear password (30 min)
      const jwtToken = generateJWTToken(
        {
          id: user._id.toString(),
          tenantId: user.tenantId ? user.tenantId.toString() : null,
          role: user.role,
          accountStatus: AccountStatus.ACTIVE,
        },
        null,
        '30m',
      );

      return {
        user: verifiedUser,
        token: jwtToken,
        message: 'OTP validated. Please create your password.',
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
      const updateUser = await this.usersService.update(
        user._id.toString(),
        user.tenantId ? user.tenantId.toString() : null,
        {
          otpCode,
          otpExpire: DateTime.now().plus({ minutes: 5 }).toUTC().toJSDate(),
        },
      );

      this.resendProvider.sendTemplateEmail({
        type: emailType.CODE_VERIFICATION,
        email: updateUser.email,
        subject: 'Código de verificación de tu cuenta Lumina',
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

      // Validar que esté en estado VERIFIED
      if (user.accountStatus !== AccountStatus.VERIFIED) {
        throw new HttpException('ACCOUNT_NOT_IN_CORRECT_STATE', HttpStatus.BAD_REQUEST);
      }

      // Activar cuenta completamente
      const userWithPassword = await this.usersService.update(
        user._id.toString(),
        user.tenantId.toString(),
        {
          password: createPasswordUserDto?.password,
          accountStatus: AccountStatus.ACTIVE,
        },
      );

      // Enviar email de bienvenida
      await this.resendProvider.sendTemplateEmail({
        email: userWithPassword.email,
        subject: `Bienvenido a Lumina ${userWithPassword?.firstName ?? ''}`,
        param: {
          name: `${userWithPassword?.firstName}`,
        },
        type: emailType.REGISTER_SUCCESS,
      });

      // JWT definitivo (1 año)
      const jwtToken = generateJWTToken({
        id: user._id.toString(),
        tenantId: user.tenantId ? user.tenantId.toString() : null,
        role: user.role,
        accountStatus: AccountStatus.ACTIVE,
      });

      return {
        user: userWithPassword,
        token: jwtToken,
        message: 'Account activated successfully',
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

      // Validar estado de la cuenta
      if (user.accountStatus === AccountStatus.PENDING_VERIFICATION) {
        throw new HttpException(
          'ACCOUNT_NOT_VERIFIED. Please verify your email first.',
          HttpStatus.UNAUTHORIZED,
        );
      }

      if (user.accountStatus === AccountStatus.VERIFIED) {
        throw new HttpException(
          'ACCOUNT_INCOMPLETE. Please create your password.',
          HttpStatus.UNAUTHORIZED,
        );
      }

      if (user.accountStatus === AccountStatus.SUSPENDED) {
        throw new HttpException('ACCOUNT_SUSPENDED. Contact support.', HttpStatus.FORBIDDEN);
      }

      if (user.accountStatus === AccountStatus.INACTIVE) {
        throw new HttpException('ACCOUNT_INACTIVE. Contact support.', HttpStatus.FORBIDDEN);
      }

      // Solo permitir login si está ACTIVE
      if (user.accountStatus !== AccountStatus.ACTIVE) {
        throw new HttpException('ACCOUNT_NOT_ACTIVE', HttpStatus.UNAUTHORIZED);
      }

      const comparePassword = await validatePassword(loginDto?.password, user?.password);

      if (!comparePassword) {
        throw new HttpException('INVALID_CREDENTIALS', HttpStatus.UNAUTHORIZED);
      }

      const token = generateJWTToken({
        id: user._id.toString(),
        tenantId: user.tenantId ? user.tenantId.toString() : null,
        role: user.role,
        accountStatus: AccountStatus.ACTIVE,
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
      const user = await this.usersService.getUserByEmail(recoveryPasswordRequestDto?.email);

      // Solo permitir recuperación si la cuenta está ACTIVE
      if (user.accountStatus !== AccountStatus.ACTIVE) {
        throw new HttpException(
          'ACCOUNT_NOT_ACTIVE. Cannot recover password.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const otpCode = generateOTP();

      await this.usersService.update(
        user._id.toString(),
        user.tenantId ? user.tenantId.toString() : null,
        {
          otpCode,
          otpExpire: DateTime.now().plus({ minutes: 5 }).toUTC().toJSDate(),
        },
      );

      this.resendProvider.sendTemplateEmail({
        type: emailType.CODE_VERIFICATION,
        email: recoveryPasswordRequestDto.email,
        subject: 'Código recuperación de cuenta en Lumina',
        param: {
          code: otpCode,
        },
      });

      return {
        message: 'Recovery code sent',
      };
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

      await this.usersService.update(
        user._id.toString(),
        user.tenantId ? user.tenantId.toString() : null,
        {
          otpCode: null,
          otpExpire: null,
        },
      );

      const userWithPassword = await this.usersService.update(
        user._id.toString(),
        user.tenantId ? user.tenantId.toString() : null,
        {
          password: changePasswordDto?.password,
        },
      );

      const jwtToken = generateJWTToken({
        id: user._id.toString(),
        tenantId: user.tenantId ? user.tenantId.toString() : null,
        role: user.role,
        accountStatus: AccountStatus.ACTIVE,
      });

      return {
        user: userWithPassword,
        token: jwtToken,
      };
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }
}
