import { ApiProperty } from '@nestjs/swagger';

export default class PaginationGeneric {
  @ApiProperty({ type: String, example: '10', required: true })
  limit: string;

  @ApiProperty({ type: String, example: '0', required: true })
  skip: string;
}
