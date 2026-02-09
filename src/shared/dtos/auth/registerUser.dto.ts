import { ApiProperty } from '@nestjs/swagger';

export default class RegisterUserDto {
  @ApiProperty({ type: String, required: true, example: 'johndoe@gmail.com' })
  email: string;

  firstName?: string;
}
