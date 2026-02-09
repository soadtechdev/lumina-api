import { ApiProperty } from '@nestjs/swagger';
import { InstitutionType } from '@shared/schemas/institution.schema';

export class CreateInstitutionDto {
  @ApiProperty({ type: String, example: 'Green Valley School', required: true })
  name: string;

  @ApiProperty({ type: String, example: 'greenvalley', required: true })
  slug: string;

  @ApiProperty({
    type: String,
    enum: InstitutionType,
    example: InstitutionType.K12,
    required: false,
  })
  type?: InstitutionType;

  @ApiProperty({ type: String, example: 'admin@greenvalley.edu', required: true })
  email: string;

  @ApiProperty({ type: String, example: '+57 300 123 4567', required: false })
  phone?: string;

  @ApiProperty({ type: String, example: 'Calle 123 #45-67', required: false })
  address?: string;

  @ApiProperty({ type: String, example: 'Bogotá', required: false })
  city?: string;

  @ApiProperty({ type: String, example: 'Colombia', required: false })
  country?: string;

  @ApiProperty({ type: String, example: '#10B981', required: false })
  primaryColor?: string;

  @ApiProperty({
    type: Object,
    example: {
      currentAcademicYear: '2024',
      academicYearStart: '2024-01-15',
      academicYearEnd: '2024-11-30',
      gradeSystem: 'numeric',
      numericScale: {
        min: 1,
        max: 5,
        passingGrade: 3,
      },
    },
    required: false,
  })
  academicConfig?: {
    currentAcademicYear: string;
    academicYearStart: Date;
    academicYearEnd: Date;
    gradeSystem: 'numeric' | 'qualitative' | 'both';
    numericScale?: {
      min: number;
      max: number;
      passingGrade: number;
    };
    qualitativeScale?: string[];
  };
}
