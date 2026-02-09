import { ApiProperty } from '@nestjs/swagger';

export default class ChangePasswordDto {
  @ApiProperty({
    type: String,
    required: true,
    example: 'prueba',
  })
  email: string;

  @ApiProperty({
    type: String,
    required: true,
    example: '4420',
  })
  otpCode: string;

  @ApiProperty({
    type: String,
    required: true,
    example: '4420',
  })
  password: string;
}
