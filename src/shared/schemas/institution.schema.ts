import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type InstitutionDocument = HydratedDocument<Institution>;

export enum InstitutionType {
  K12 = 'k12',
  UNIVERSITY = 'university',
}

export enum InstitutionStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
}

@Schema({ timestamps: true, collection: 'institutions' })
export class Institution {
  @Prop({ type: String, required: true, unique: true })
  name: string;

  @Prop({ type: String, required: true, unique: true, lowercase: true })
  slug: string;

  @Prop({ type: String, enum: InstitutionType, default: InstitutionType.K12 })
  type: InstitutionType;

  @Prop({ type: String, enum: InstitutionStatus, default: InstitutionStatus.TRIAL })
  status: InstitutionStatus;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String })
  phone: string;

  @Prop({ type: String })
  address: string;

  @Prop({ type: String })
  city: string;

  @Prop({ type: String })
  country: string;

  @Prop({ type: String })
  logo: string;

  @Prop({ type: String, default: '#4F46E5' })
  primaryColor: string;

  @Prop({
    type: {
      currentAcademicYear: String,
      academicYearStart: Date,
      academicYearEnd: Date,
      gradeSystem: {
        type: String,
        enum: ['numeric', 'qualitative', 'both'],
        default: 'numeric',
      },
      numericScale: {
        min: Number,
        max: Number,
        passingGrade: Number,
      },
      qualitativeScale: [String],
    },
    _id: false,
  })
  academicConfig: {
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

  @Prop({
    type: {
      maxStudents: Number,
      maxTeachers: Number,
      maxStorage: Number,
    },
    default: {
      maxStudents: 500,
      maxTeachers: 50,
      maxStorage: 5,
    },
  })
  limits: {
    maxStudents: number;
    maxTeachers: number;
    maxStorage: number;
  };

  @Prop({ type: Date })
  trialEndsAt: Date;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Date })
  deletedAt: Date;
}

export const InstitutionSchema = SchemaFactory.createForClass(Institution);

InstitutionSchema.index({ slug: 1 }, { unique: true });
InstitutionSchema.index({ status: 1 });
InstitutionSchema.index({ type: 1 });
