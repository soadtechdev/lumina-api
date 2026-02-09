import { ApiProperty } from '@nestjs/swagger';

export default class CreateUserContactDto {
  @ApiProperty({ type: String, example: 'John', required: true })
  firstName?: string;

  @ApiProperty({ type: String, example: 'Doe', required: false })
  lastName?: string;

  @ApiProperty({ type: String, example: 'johndoe@gmail.com', required: true })
  email?: string;

  @ApiProperty({ type: String, example: '+3455499321', required: false })
  phone?: string;

  @ApiProperty({ type: String, example: 'google.com/images/imagen.jpg', required: false })
  avatar?: string;
}
