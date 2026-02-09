import { ApiProperty } from '@nestjs/swagger';

export default class ValidateOtpDto {
  @ApiProperty({ type: String, required: true, example: 'johndoe@gmail.com' })
  email: string;

  @ApiProperty({ type: String, required: true, example: '4013', maximum: 4 })
  otpCode: string;
}
