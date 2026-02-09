import { ApiProperty } from '@nestjs/swagger';

export default class RecoveryPasswordRequestDto {
  @ApiProperty({
    type: String,
    required: true,
    example: 'prueba',
  })
  email: string;
}
