import { ApiProperty } from '@nestjs/swagger';

export default class RegenerateOtpDto {
  @ApiProperty({ type: String, required: true, example: 'johndoe@gmail.com' })
  email: string;
}
