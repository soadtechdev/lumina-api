import { ApiProperty } from '@nestjs/swagger';
import { AccountStatus, UserGenders } from '@shared/schemas/user.schema';
import { DateTime } from 'luxon';

export class UpdateUserDto {
  @ApiProperty({ type: String, example: 'John', required: false })
  firstName?: string;

  @ApiProperty({ type: String, example: 'Doe', required: false })
  lastName?: string;

  @ApiProperty({ type: String, example: 'johndoe@gmail.com', required: false })
  email?: string;

  @ApiProperty({ type: String, example: '+3455499321', required: false })
  phoneNumber?: string;

  @ApiProperty({ type: String, example: 'password', required: false })
  password?: string;

  @ApiProperty({ type: String, example: 'google.com/images/imagen.jpg', required: false })
  avatar?: string;

  @ApiProperty({ type: String, enum: UserGenders, example: UserGenders.MALE })
  gender?: UserGenders;

  @ApiProperty({ type: Date, example: DateTime.now(), required: false })
  birthday?: Date;

  @ApiProperty({ type: Boolean, default: true })
  isActive?: boolean;

  // PRIVATE VALUES
  accountStatus?: AccountStatus;
  otpCode?: string;
  otpExpire?: Date;
}
