import { ApiProperty } from '@nestjs/swagger';
import { InstitutionStatus, InstitutionType } from '@shared/schemas/institution.schema';

export class UpdateInstitutionDto {
  @ApiProperty({ type: String, required: false })
  name?: string;

  @ApiProperty({ type: String, enum: InstitutionType, required: false })
  type?: InstitutionType;

  @ApiProperty({ type: String, enum: InstitutionStatus, required: false })
  status?: InstitutionStatus;

  @ApiProperty({ type: String, required: false })
  email?: string;

  @ApiProperty({ type: String, required: false })
  phone?: string;

  @ApiProperty({ type: String, required: false })
  address?: string;

  @ApiProperty({ type: String, required: false })
  city?: string;

  @ApiProperty({ type: String, required: false })
  country?: string;

  @ApiProperty({ type: String, required: false })
  logo?: string;

  @ApiProperty({ type: String, required: false })
  primaryColor?: string;

  @ApiProperty({ type: Object, required: false })
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

  @ApiProperty({ type: Object, required: false })
  limits?: {
    maxStudents: number;
    maxTeachers: number;
    maxStorage: number;
  };

  @ApiProperty({ type: Boolean, required: false })
  isActive?: boolean;
}
