import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { BaseTenantEntity } from './base-tenant.schema';

export type UserDocument = HydratedDocument<User>;

export enum UserGenders {
  MALE = 'male',
  FEMALE = 'female',
  OTHERS = 'others',
}

export enum RoleUser {
  // Roles globales (sin tenant)
  SUPER_ADMIN = 'super_admin', // Lumina Tech

  // Roles K12 (con tenant)
  DIRECTOR = 'director', // Director del colegio
  COORDINATOR = 'coordinator', // Coordinador académico
  TEACHER = 'teacher', // Docente
  STUDENT = 'student', // Estudiante
  GUARDIAN = 'guardian', // Acudiente/Padre

  // Roles Universidad (Fase 2)
  RECTOR = 'rector',
  PROFESSOR = 'professor',
}

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User extends BaseTenantEntity {
  @Prop({ type: String, required: true })
  firstName: string;

  @Prop({ type: String })
  lastName: string;

  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String })
  phoneNumber: string;

  @Prop({ type: String })
  password: string;

  @Prop({ type: String })
  avatar: string;

  @Prop({ type: String, enum: UserGenders })
  gender: UserGenders;

  @Prop({ type: Date })
  birthday: Date;

  @Prop({ type: String })
  otpCode: string;

  @Prop({ type: Date })
  otpExpire: Date;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({
    type: String,
    enum: RoleUser,
    default: RoleUser.STUDENT,
  })
  role: RoleUser;

  // Para estudiantes K12
  @Prop({ type: Types.ObjectId, ref: 'Grade' })
  gradeId: Types.ObjectId; // Grado asignado

  @Prop({ type: Types.ObjectId, ref: 'Section' })
  sectionId: Types.ObjectId; // Grupo/Sección

  // Para docentes
  @Prop([{ type: Types.ObjectId, ref: 'Subject' }])
  subjects: Types.ObjectId[]; // Materias que enseña

  // Relación acudiente-estudiante
  @Prop([{ type: Types.ObjectId, ref: 'User' }])
  guardians: Types.ObjectId[]; // IDs de acudientes

  @Prop([{ type: Types.ObjectId, ref: 'User' }])
  students: Types.ObjectId[]; // IDs de estudiantes (si es acudiente)
}

export const UserSchema = SchemaFactory.createForClass(User);

// Índices críticos para multi-tenant
UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });
UserSchema.index({ tenantId: 1, role: 1 });
UserSchema.index({ tenantId: 1, gradeId: 1 });
UserSchema.index({ tenantId: 1, deletedAt: 1 });
