import { ApiProperty } from '@nestjs/swagger';
export class GoogleUserDto {
  @ApiProperty()
  idToken: string;
}
