import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import ResendProvider from '@shared/providers/resend.provider';
// CONSTANTS
import constants from 'src/contants';
import { HttpModule } from '@nestjs/axios';

import { UsersModule } from '../users/users.module';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: constants.JWT_SECRET,
    }),
    HttpModule.register({
      timeout: 50000,
      maxRedirects: 5,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, ResendProvider],
})
export class AuthModule {}
