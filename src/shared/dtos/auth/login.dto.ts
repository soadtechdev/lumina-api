import { ApiProperty } from '@nestjs/swagger';

export default class LoginDto {
  @ApiProperty({ type: String, required: true, example: 'johndoe@gmail.com' })
  email: string;

  @ApiProperty({ type: String, required: true, example: 'password' })
  password: string;
}
