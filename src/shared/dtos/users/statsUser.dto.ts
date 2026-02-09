import { IsOptional, IsString, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetUserStatsDto {
  @ApiPropertyOptional({
    description: 'Filter by month in format YYYY-MM (e.g., 2025-10)',
    example: '2025-10',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'Month must be in format YYYY-MM (e.g., 2025-10)',
  })
  month?: string;
}
