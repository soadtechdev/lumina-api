import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type InstitutionDocument = HydratedDocument<Institution>;

export enum InstitutionType {
  K12 = 'k12', // Colegio
  UNIVERSITY = 'university', // Universidad (Fase 2)
}

export enum InstitutionStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
}

@Schema({ timestamps: true, collection: 'institutions' })
export class Institution {
  @Prop({ type: String, required: true, unique: true })
  name: string; // "Green Valley School"

  @Prop({ type: String, required: true, unique: true, lowercase: true })
  slug: string; // "greenvalley" (para subdomain)

  @Prop({ type: String, enum: InstitutionType, default: InstitutionType.K12 })
  type: InstitutionType;

  @Prop({
    type: String,
    enum: InstitutionStatus,
    default: InstitutionStatus.TRIAL,
  })
  status: InstitutionStatus;

  // Información de contacto
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

  // Logo y branding
  @Prop({ type: String })
  logo: string;

  @Prop({ type: String, default: '#4F46E5' }) // Color primario
  primaryColor: string;

  // Configuración académica (K12)
  @Prop({
    type: {
      currentAcademicYear: String, // "2024"
      academicYearStart: Date, // Inicio del año escolar
      academicYearEnd: Date, // Fin del año escolar
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
      qualitativeScale: [String], // ['E', 'S', 'A', 'I', 'D']
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

  // Límites de plan (para facturación futura)
  @Prop({
    type: {
      maxStudents: Number,
      maxTeachers: Number,
      maxStorage: Number, // GB
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

// Índices
InstitutionSchema.index({ slug: 1 }, { unique: true });
InstitutionSchema.index({ status: 1 });
