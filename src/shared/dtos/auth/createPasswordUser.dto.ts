import { ApiProperty } from '@nestjs/swagger';

export default class CreatePasswordUserDto {
  @ApiProperty({ type: String, required: true, example: 'johndoe@gmail.com' })
  email: string;

  @ApiProperty({ type: String, required: true, example: 'password' })
  password: string;
}
