import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { DateTime } from 'luxon';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserGenders {
  MALE = 'male',
  FEMALE = 'female',
  OTHERS = 'others',
}

export enum UserLanguage {
  ES = 'es',
  EN = 'en',
  DE = 'de',
  FR = 'fr',
}

export enum RoleUser {
  user = 'user',
  admin = 'admin',
}

export enum RegisterStep {
  GUEST_USER = 'guest_user', // When the user is a guest
  OTP_VERIFICATION = 'otp_verification', // When OTP code is sent
  OTP_VERIFIED = 'otp_verified', // When OTP code is verified
  PASSWORD_CREATED = 'password_created', // when the user creates their password
  PROFILE_CREATED = 'profile_created', // when the user does not have a profile
  COMPLETED = 'completed', // when the user creates their profile name, avatar, and primary data
}

export enum CurrencyType {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  COP = 'COP',
  CAD = 'CAD',
  MXN = 'MXN',
  BRL = 'BRL',
  ARS = 'ARS',
}

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User {
  @ApiProperty({ type: String, example: 'John', required: false })
  @Prop({ type: String, required: false })
  firstName: string;

  @ApiProperty({ type: String, example: 'Doe', required: false })
  @Prop({ type: String, required: false })
  lastName: string;

  @ApiProperty({ type: String, example: 'johndoe@gmail.com', required: true })
  @Prop({ type: String, required: false, unique: true })
  email: string;

  @ApiProperty({ type: String, example: '+3455499321', required: false })
  @Prop({ type: String, required: false })
  phoneNumber: string;

  @ApiProperty({ type: String, example: 'password', required: false })
  @Prop({ type: String, required: false })
  password: string;

  @ApiProperty({ type: String, example: 'google.com/images/imagen.jpg', required: false })
  @Prop({ type: String, required: false })
  avatar: string;

  @ApiProperty({ type: String, enum: UserGenders, example: UserGenders.MALE })
  @Prop({ type: String, enum: UserGenders, required: false })
  gender: UserGenders;

  @ApiProperty({ type: Date, example: DateTime.now(), required: false })
  @Prop({ type: Date, required: false })
  birthday: Date;

  @Prop({ type: String, required: false })
  otpCode: string;

  @Prop({ type: Date, required: false })
  otpExpire: Date;

  @ApiProperty({ type: Boolean, default: true })
  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: String, enum: RoleUser, default: RoleUser.user })
  role: RoleUser;

  @Prop({ type: String, enum: RegisterStep, default: RegisterStep.OTP_VERIFICATION })
  step: RegisterStep;

  @Prop({ type: String, enum: CurrencyType, default: CurrencyType.EUR })
  currency: CurrencyType;

  @Prop({ type: String, enum: UserLanguage, default: UserLanguage.ES })
  language: UserLanguage;

  @Prop({ type: Date, required: false })
  deletedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// DEFINED INDEX
UserSchema.index({
  email: 1,
  phoneNumber: 1,
});
