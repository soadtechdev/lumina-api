import { Body, Controller, Headers, Post, Req, UseGuards, UsePipes, Version } from '@nestjs/common';
import { ApiBadGatewayResponse, ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import RegisterUserDto from '@shared/dtos/auth/registerUser.dto';
import ValidateOtpDto from '@shared/dtos/auth/validateOtp.dto';
import RegenerateOtpDto from '@shared/dtos/auth/regenerateOtp.dto';
import CreatePasswordUserDto from '@shared/dtos/auth/createPasswordUser.dto';
import LoginDto from '@shared/dtos/auth/login.dto';
import { JoiValidationPipe } from '@shared/pipes/joiValidationPipe';
import AuthenticatedRequest from '@shared/interfaces/authenticatedRequest.interface';
import { JwtGuard } from '@shared/guards/jwt.guard';
import { UpdateUserDto } from '@shared/dtos/users/updateUser.dto';
import RecoveryPasswordRequestDto from '@shared/dtos/auth/recoveryPasswordRequest.dto';
import ChangePasswordDto from '@shared/dtos/auth/changePassword.dto';
import { GoogleUserDto } from '@shared/dtos/auth/googleUser.dto';

import {
  changePasswordValidationSchema,
  createPasswordUserValidationSchema,
  loginGoogleValidationSchema,
  loginValidationSchema,
  recoveryPasswordRequestValidationSchema,
  regenerateOtpValidationSchema,
  registerUserValidationSchema,
  validateOtpValidationSchema,
} from './joiSchema';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Version('1')
  @UsePipes(new JoiValidationPipe(registerUserValidationSchema))
  @ApiCreatedResponse({ description: 'The user register succesfully', type: UpdateUserDto })
  @ApiBadGatewayResponse({ description: 'The user register failed' })
  @Post('register-user')
  async registerUser(
    @Body() registerUserDto: RegisterUserDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return await this.authService.registerUser(registerUserDto, tenantId);
  }

  @Version('1')
  @UsePipes(new JoiValidationPipe(validateOtpValidationSchema))
  @Post('validate-otp')
  async validateOtp(@Body() validateOtpDto: ValidateOtpDto) {
    return await this.authService.validateOTP(validateOtpDto);
  }

  @Version('1')
  @UsePipes(new JoiValidationPipe(regenerateOtpValidationSchema))
  @Post('regenerate-otp')
  async regenerateOtp(@Body() regenerateOtpDto: RegenerateOtpDto) {
    return await this.authService.regenerateOtp(regenerateOtpDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Version('1')
  @UsePipes(new JoiValidationPipe(createPasswordUserValidationSchema))
  @Post('create-password-user')
  async createPasswordUser(
    @Body() createPasswordUserDto: CreatePasswordUserDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const user = request?.user;

    return await this.authService.createPasswordUser(createPasswordUserDto, user);
  }

  @Version('1')
  @UsePipes(new JoiValidationPipe(loginValidationSchema))
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Version('1')
  @UsePipes(new JoiValidationPipe(recoveryPasswordRequestValidationSchema))
  @Post('recovery-password-request')
  async recoveryPassword(@Body() recoveryPasswordRequestDto: RecoveryPasswordRequestDto) {
    return await this.authService.recoveryPasswordRequest(recoveryPasswordRequestDto);
  }

  @Version('1')
  @UsePipes(new JoiValidationPipe(changePasswordValidationSchema))
  @Post('change-password')
  async changePassword(@Body() changePasswordDto: ChangePasswordDto) {
    return await this.authService.changePassword(changePasswordDto);
  }
}
