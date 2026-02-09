# Lumina Campus - Backend API

> Plataforma educativa (LMS + ERP Académico) para gestión de instituciones K12 con arquitectura multi-tenant.

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

---

## Tabla de Contenidos

- [Visión General](#-visión-general)
- [Arquitectura Multi-Tenant](#️-arquitectura-multi-tenant)
- [Módulos Implementados](#-módulos-implementados)
- [Sistema de Seguridad](#️-sistema-de-seguridad)
- [Schemas MongoDB](#️-schemas-mongodb)
- [Instalación](#-instalación)
- [Configuración](#️-configuración)
- [Scripts Disponibles](#-scripts-disponibles)
- [Flujo de Uso](#-flujo-de-uso)
- [Testing](#-testing)
- [Roadmap](#️-roadmap)

---

## Visión General

**Lumina Campus** es una plataforma integral diseñada para gestionar colegios de educación básica y media (K12). El MVP está enfocado en flujos escolares básicos con una arquitectura multi-tenant que permite aislar completamente los datos entre diferentes instituciones educativas.

###  Características Principales

- **Multi-tenancy**: Base de datos compartida con aislamiento por `tenantId`
- **Autenticación robusta**: Flujo de registro en 3 pasos con OTP por email
- **Sistema de roles**: 6 roles diferentes (Super Admin, Director, Coordinador, Docente, Estudiante, Acudiente)
- **Gestión de instituciones**: CRUD completo para administración de colegios
- **Seguridad por capas**: Guards para JWT, Tenant, Account Status y Super Admin
- **Notificaciones por email**: Integración con Resend para OTP y bienvenida

---

## Arquitectura Multi-Tenant

### Estrategia: Shared Database con Discriminador
```
MongoDB (Única base de datos)
│
├─ Collection: institutions
│  ├─ Green Valley School (ID: 698a61837beae6f2ad4ca8f2)
│  └─ Bright Academy (ID: xyz987...)
│
├─ Collection: users
│  ├─ Director Juan (tenantId: 698a..., role: director)
│  ├─ Docente María (tenantId: 698a..., role: teacher)
│  ├─ Estudiante Pedro (tenantId: 698a..., role: student)
│  ├─ Rector Carlos (tenantId: xyz987..., role: director)
│  └─ Super Admin (tenantId: null, role: super_admin)
│
└─ Collection: [future academic data]
   ├─ Grades, Subjects, Attendance...
   └─ Todos con tenantId para aislamiento
```

#### Ventajas de esta Arquitectura

| Aspecto | Beneficio |
|---------|-----------|
|  **Costo** | Un solo cluster MongoDB (vs N clusters) |
|  **Mantenimiento** | Migraciones únicas para todos los tenants |
|  **Escalabilidad** | Soporta 50-200 instituciones en un M20 |
|  **MVP** | Rápido de desarrollar y desplegar |
|  **Migración futura** | Posible migrar a DB-per-tenant si crece |

#### Reglas Críticas de Seguridad
```typescript
// ❌ NUNCA hacer queries sin tenantId
await this.userModel.find({ email });

// ✅ SIEMPRE filtrar por tenant (excepto Super Admin)
await this.userModel.find({ tenantId, email });

// ✅ Excepciones válidas
// - Login inicial (buscar email globalmente)
// - Super Admin (tenantId === null)
```

---

##  Módulos Implementados

### 1- Auth Module

Sistema completo de autenticación con flujo de registro progresivo.

#### Flujo de Registro (3 Pasos)
```
┌─────────────────────────┐
│  1. register-user       │
│  Headers: x-tenant-id   │
│  Body: { email }        │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  PENDING_VERIFICATION   │
│  - OTP enviado por email│
│  - Código válido 5 min  │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  2. validate-otp        │
│  Body: { email, code }  │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  VERIFIED               │
│  - Token temporal 30min │
│  - Puede crear password │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  3. create-password     │
│  Headers: Bearer token  │
│  Body: { password }     │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  ACTIVE ✅              │
│  - Cuenta completa      │
│  - Email de bienvenida  │
│  - Token definitivo 1y  │
└─────────────────────────┘
```

#### Estados de Cuenta

| Estado | Descripción | Puede hacer login |
|--------|-------------|-------------------|
| `PENDING_VERIFICATION` | Esperando validar OTP | ❌ No |
| `VERIFIED` | OTP validado, falta password | ❌ No |
| `ACTIVE` | Cuenta completa y funcional | ✅ Sí |
| `SUSPENDED` | Suspendida por admin | ❌ No |
| `INACTIVE` | Desactivada | ❌ No |

#### Endpoints de Autenticación

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/v1/auth/register-user` | Iniciar registro (envía OTP) | Header: `x-tenant-id` |
| POST | `/v1/auth/validate-otp` | Validar código OTP | Public |
| POST | `/v1/auth/regenerate-otp` | Reenviar OTP | Public |
| POST | `/v1/auth/create-password-user` | Crear contraseña | JWT (temporal) |
| POST | `/v1/auth/login` | Login | Public |
| POST | `/v1/auth/recovery-password-request` | Solicitar recuperación | Public |
| POST | `/v1/auth/change-password` | Cambiar contraseña con OTP | Public |

---

### 2- Users Module

Gestión completa de usuarios con roles específicos para K12.

#### Roles Disponibles
```typescript
enum RoleUser {
  // Rol global (sin tenant)
  SUPER_ADMIN = 'super_admin',  // Administra toda la plataforma Lumina
  
  // Roles K12 (con tenant)
  DIRECTOR = 'director',         // Director del colegio
  COORDINATOR = 'coordinator',   // Coordinador académico
  TEACHER = 'teacher',           // Docente
  STUDENT = 'student',           // Estudiante
  GUARDIAN = 'guardian',         // Acudiente/Padre de familia
  
  // Roles Universidad (Fase 2)
  RECTOR = 'rector',             // Rector universidad
  PROFESSOR = 'professor',       // Profesor universitario
}
```

#### Estructura del Schema User
```typescript
{
  _id: ObjectId,
  tenantId: ObjectId | null,      // null solo para SUPER_ADMIN
  
  // Datos básicos
  email: string,
  firstName: string,
  lastName: string,
  password: string,
  phoneNumber: string,
  avatar: string,
  gender: 'male' | 'female' | 'others',
  birthday: Date,
  
  // Control de cuenta
  role: RoleUser,
  accountStatus: AccountStatus,
  isActive: boolean,
  
  // Campos específicos por rol
  gradeId: ObjectId,              // Solo STUDENT
  sectionId: ObjectId,            // Solo STUDENT
  subjects: [ObjectId],           // Solo TEACHER
  guardians: [ObjectId],          // Solo STUDENT
  students: [ObjectId],           // Solo GUARDIAN
  
  // OTP (temporal)
  otpCode: string,
  otpExpire: Date,
  
  // Soft delete
  deletedAt: Date,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
}
```

#### Endpoints de Usuarios

| Método | Endpoint | Descripción | Guards |
|--------|----------|-------------|--------|
| GET | `/v1/users/by-id/:id` | Buscar usuario por ID | JWT + Tenant + Active |
| GET | `/v1/users/by-email/:email` | Buscar usuario por email | JWT + Tenant + Active |
| GET | `/v1/users/search-user/:name` | Buscar usuarios por nombre | JWT + Tenant + Active |
| PATCH | `/v1/users/:id` | Actualizar usuario | JWT + Tenant + Active |
| DELETE | `/v1/users/:id` | Eliminar usuario (soft delete) | JWT + Tenant + Active |

---

### 3- Institutions Module

Gestión de instituciones educativas (tenants). **Solo accesible para Super Admin.**

#### Estructura del Schema Institution
```typescript
{
  _id: ObjectId,
  
  // Información básica
  name: string,                   // "Green Valley School"
  slug: string,                   // "greenvalley" (único)
  type: 'k12' | 'university',
  status: 'active' | 'trial' | 'suspended',
  
  // Contacto
  email: string,
  phone: string,
  address: string,
  city: string,
  country: string,
  
  // Branding
  logo: string,
  primaryColor: string,           // "#10B981"
  
  // Configuración académica (K12)
  academicConfig: {
    currentAcademicYear: string,  // "2025"
    academicYearStart: Date,      // 2025-01-20
    academicYearEnd: Date,        // 2025-11-30
    gradeSystem: 'numeric' | 'qualitative' | 'both',
    numericScale: {
      min: number,                // 1
      max: number,                // 5
      passingGrade: number,       // 3
    },
    qualitativeScale: [string],   // ['E', 'S', 'A', 'I', 'D']
  },
  
  // Límites de plan
  limits: {
    maxStudents: number,          // 500
    maxTeachers: number,          // 50
    maxStorage: number,           // 5 GB
  },
  
  // Control
  trialEndsAt: Date,
  isActive: boolean,
  deletedAt: Date,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
}
```

#### Endpoints de Instituciones

| Método | Endpoint | Descripción | Guards |
|--------|----------|-------------|--------|
| POST | `/v1/institutions` | Crear institución | JWT + SuperAdmin |
| GET | `/v1/institutions` | Listar todas las instituciones | Public |
| GET | `/v1/institutions/:id` | Buscar institución por ID | Public |
| GET | `/v1/institutions/slug/:slug` | Buscar institución por slug | Public |
| PATCH | `/v1/institutions/:id` | Actualizar institución | JWT + SuperAdmin |
| DELETE | `/v1/institutions/:id` | Eliminar institución | JWT + SuperAdmin |

---

## Sistema de Seguridad

### Guards Implementados

#### 1. JwtGuard
- **Propósito**: Valida token JWT y decodifica payload
- **Ubicación**: `src/shared/guards/jwt.guard.ts`
- **Uso**: Todas las rutas protegidas
- **Acción**: Inyecta `user` en `request.user`
```typescript
@UseGuards(JwtGuard)
@Get('/protected')
getProtected(@GetUser() user: IUserDataJWT) {
  // user disponible aquí
}
```

#### 2. TenantGuard
- **Propósito**: Valida que el usuario tenga `tenantId` (excepto Super Admin)
- **Ubicación**: `src/shared/guards/tenant.guard.ts`
- **Uso**: Rutas que requieren contexto de institución
- **Acción**: Inyecta `tenantId` en `request.tenantId`
```typescript
@UseGuards(JwtGuard, TenantGuard)
@Get('/tenant-data')
getTenantData(@TenantId() tenantId: string) {
  // tenantId disponible aquí
}
```

#### 3. AccountActiveGuard
- **Propósito**: Valida que `accountStatus === ACTIVE`
- **Ubicación**: `src/shared/guards/account-active.guard.ts`
- **Uso**: Rutas que requieren cuenta completamente activa
- **Acción**: Bloquea usuarios con cuentas incompletas
```typescript
@UseGuards(JwtGuard, TenantGuard, AccountActiveGuard)
@Controller('users')
export class UsersController {
  // Todos los endpoints requieren cuenta activa
}
```

#### 4. SuperAdminGuard
- **Propósito**: Valida que `role === SUPER_ADMIN`
- **Ubicación**: `src/shared/guards/super-admin.guard.ts`
- **Uso**: Rutas administrativas (crear/editar instituciones)
- **Acción**: Bloquea acceso a usuarios no Super Admin
```typescript
@UseGuards(JwtGuard, SuperAdminGuard)
@Post('/institutions')
createInstitution() {
  // Solo Super Admin puede ejecutar esto
}
```

### Decorators Personalizados
```typescript
// Obtener tenant del request
@TenantId() tenantId: string

// Obtener usuario completo del JWT
@GetUser() user: IUserDataJWT

// Obtener una propiedad específica del usuario
@GetUser('id') userId: string
```

### Estructura del JWT
```typescript
interface IUserDataJWT {
  id: string,                    // User ID
  tenantId: string | null,       // null para Super Admin
  role: RoleUser,
  accountStatus: AccountStatus,
  iat: number,                   // Issued at
  exp: number,                   // Expiration
}
```

**Tiempos de expiración:**
- Token temporal (después de validar OTP): **30 minutos**
- Token definitivo (después de crear password/login): **1 año**

---

## Schemas MongoDB

### Schemas Principales

#### BaseTenantEntity (Clase base)
```typescript
{
  tenantId: ObjectId,            // Referencia a Institution
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date,
}
```

Todos los schemas (excepto Institution) heredan de esta clase para garantizar aislamiento multi-tenant.

#### Índices Críticos
```typescript
// User Schema
UserSchema.index({ tenantId: 1, email: 1 });      // Unique compound
UserSchema.index({ tenantId: 1, role: 1 });
UserSchema.index({ tenantId: 1, gradeId: 1 });
UserSchema.index({ tenantId: 1, deletedAt: 1 });
UserSchema.index({ role: 1 });                     // Para Super Admin
UserSchema.index({ email: 1 });                    // Para login global

// Institution Schema
InstitutionSchema.index({ slug: 1 });              // Unique
InstitutionSchema.index({ status: 1 });
InstitutionSchema.index({ type: 1 });
```

---

## Instalación

### Prerrequisitos

- Node.js >= 18
- MongoDB >= 6.0
- Yarn o NPM

### Pasos de Instalación
```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-org/lumina-api.git
cd lumina-api

# 2. Instalar dependencias
yarn install
# o
npm install

# 3. Copiar variables de entorno
cp .env.example .env

# 4. Configurar variables de entorno (ver sección siguiente)

# 5. Compilar el proyecto
yarn build

# 6. Ejecutar seeds (crear datos iniciales)
yarn seed:institutions
yarn seed:super-admin

# 7. Iniciar en desarrollo
yarn start:dev
```

---

## Configuración

### Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:
```env
# Aplicación
NODE_ENV=development
PORT=3000

# MongoDB
MONGO_STRING_CONNECTION=mongodb+srv://user:pass@cluster.mongodb.net/
MONGO_DB_NAME=lumina_dev

# JWT
JWT_SECRET=tu-secret-key-super-segura-aqui

# Email (Resend)
RESEND_API_KEY=re_tu_api_key_aqui
```

### Configuración de MongoDB Atlas (Recomendado)

1. Crear cluster en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crear usuario de base de datos
3. Whitelist IP (0.0.0.0/0 para desarrollo)
4. Obtener connection string
5. Reemplazar `<password>` con tu contraseña

### Configuración de Resend (Email)

1. Crear cuenta en [Resend](https://resend.com)
2. Obtener API Key
3. Verificar dominio (opcional para producción)
4. Agregar API key en `.env`

---

## Scripts Disponibles

### Desarrollo
```bash
# Iniciar en modo desarrollo (hot reload)
yarn start:dev

# Compilar proyecto
yarn build

# Iniciar en producción
yarn start:prod

# Linting
yarn lint

# Formatear código
yarn format
```

### Seeds (Datos Iniciales)
```bash
# Crear institución de prueba (Green Valley School)
yarn seed:institutions

# Crear Super Admin
# Email: admin@lumina.tech
# Password: SuperAdmin123!
yarn seed:super-admin
```

### Testing
```bash
# Tests unitarios
yarn test

# Tests e2e
yarn test:e2e

# Cobertura
yarn test:cov
```

---

## Flujo de Uso

### 1. Crear Institución (Super Admin)
```bash
# Primero, crear Super Admin
yarn seed:super-admin

# Login como Super Admin
POST /api/v1/auth/login
{
  "email": "admin@lumina.tech",
  "password": "SuperAdmin123!"
}

# Respuesta:
{
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}

# Crear nueva institución
POST /api/v1/institutions
Headers: { "Authorization": "Bearer {token}" }
{
  "name": "Bright Academy",
  "slug": "brightacademy",
  "email": "admin@brightacademy.edu",
  "academicConfig": {
    "currentAcademicYear": "2025",
    "academicYearStart": "2025-02-01",
    "academicYearEnd": "2025-12-15",
    "gradeSystem": "numeric",
    "numericScale": {
      "min": 1,
      "max": 5,
      "passingGrade": 3
    }
  }
}

# Respuesta:
{
  "_id": "xyz987...",
  "name": "Bright Academy",
  "slug": "brightacademy",
  ...
}
```

### 2. Registrar Director en Institución
```bash
# Paso 1: Registro inicial
POST /api/v1/auth/register-user
Headers: { "x-tenant-id": "698a61837beae6f2ad4ca8f2" }
{
  "email": "director@greenvalley.edu",
  "firstName": "Juan"
}

# Respuesta:
{
  "email": "director@greenvalley.edu",
  "accountStatus": "pending_verification",
  ...
}
# Email enviado con OTP

# Paso 2: Validar OTP
POST /api/v1/auth/validate-otp
{
  "email": "director@greenvalley.edu",
  "otpCode": "1234"
}

# Respuesta:
{
  "user": { "accountStatus": "verified", ... },
  "token": "eyJhbGciOiJIUzI1NiIs...",  // Token temporal 30min
  "message": "OTP validated. Please create your password."
}

# Paso 3: Crear contraseña
POST /api/v1/auth/create-password-user
Headers: { "Authorization": "Bearer {token_temporal}" }
{
  "email": "director@greenvalley.edu",
  "password": "Director123!"
}

# Respuesta:
{
  "user": { "accountStatus": "active", ... },
  "token": "eyJhbGciOiJIUzI1NiIs...",  // Token definitivo 1 año
  "message": "Account activated successfully"
}
# Email de bienvenida enviado
```

### 3. Login y Consulta de Usuarios
```bash
# Login
POST /api/v1/auth/login
{
  "email": "director@greenvalley.edu",
  "password": "Director123!"
}

# Respuesta:
{
  "user": {
    "_id": "abc123",
    "tenantId": "698a61837beae6f2ad4ca8f2",
    "email": "director@greenvalley.edu",
    "role": "director",
    "accountStatus": "active"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}

# Buscar usuarios de su institución
GET /api/v1/users/search-user/Maria
Headers: { "Authorization": "Bearer {token}" }

# Respuesta: Solo usuarios con el mismo tenantId
[
  {
    "_id": "def456",
    "tenantId": "698a61837beae6f2ad4ca8f2",
    "firstName": "María",
    "role": "teacher",
    ...
  }
]
```

---

## Testing

### Casos de Prueba Críticos

#### 1. Aislamiento Multi-Tenant
```typescript
describe('Multi-Tenant Isolation', () => {
  it('should not access data from another tenant', async () => {
    // Usuario de Green Valley
    const userA = await createUser('test@greenvalley.edu', tenantA);
    
    // Intento de acceso desde otro tenant
    await expect(
      service.getUserById(userA._id, tenantB)
    ).rejects.toThrow('USER NOT FOUND');
  });
  
  it('should only search users within same tenant', async () => {
    await createUser('Alice', tenantA);
    await createUser('Alice', tenantB);
    
    const results = await service.searchUser('Alice', tenantA);
    
    expect(results).toHaveLength(1);
    expect(results[0].tenantId).toBe(tenantA);
  });
});
```

#### 2. Flujo de Registro Completo
```typescript
describe('Registration Flow', () => {
  it('should complete full registration process', async () => {
    // 1. Register
    const user = await service.registerUser({
      email: 'test@test.com'
    }, tenantId);
    expect(user.accountStatus).toBe('pending_verification');
    
    // 2. Validate OTP
    const validated = await service.validateOTP({
      email: 'test@test.com',
      otpCode: user.otpCode
    });
    expect(validated.user.accountStatus).toBe('verified');
    
    // 3. Create Password
    const active = await service.createPasswordUser({
      email: 'test@test.com',
      password: 'Test123!'
    }, { id: user._id });
    expect(active.user.accountStatus).toBe('active');
  });
});
```

#### 3. Guards de Seguridad
```typescript
describe('Security Guards', () => {
  it('should block access with inactive account', async () => {
    const token = generateToken({
      id: userId,
      accountStatus: 'pending_verification'
    });
    
    await expect(
      request(app)
        .get('/users/by-id/123')
        .set('Authorization', `Bearer ${token}`)
    ).rejects.toThrow('Account is not active');
  });
  
  it('should allow only Super Admin to create institutions', async () => {
    const directorToken = generateToken({ role: 'director' });
    
    await expect(
      request(app)
        .post('/institutions')
        .set('Authorization', `Bearer ${directorToken}`)
    ).rejects.toThrow('Only Super Admins can perform this action');
  });
});
```

---

## Roadmap

### Fase 0-1: Fundamentos (Completado)

- [x] Arquitectura multi-tenant
- [x] Sistema de autenticación completo
- [x] Gestión de usuarios
- [x] Gestión de instituciones
- [x] Guards de seguridad
- [x] Seeds de datos iniciales

### Fase 2: Estructura Académica K12 (En Progreso)

- [ ] Schema `AcademicYear` (2024, 2025, 2026)
- [ ] Schema `Grade` (Grado 1-11)
- [ ] Schema `Section` (1A, 1B, 1C)
- [ ] Schema `Subject` (Matemáticas, Español, etc.)
- [ ] Asignación de estudiantes a grados/secciones
- [ ] Asignación de docentes a materias

### Fase 3: Asistencia (Próximo)

- [ ] Registro diario de asistencia
- [ ] Estados: Presente, Ausente, Tarde, Excusado
- [ ] Reportes de ausentismo
- [ ] Notificaciones a acudientes

### Fase 4: Calificaciones (Próximo)

- [ ] Configuración de escalas (numérica/cualitativa)
- [ ] Registro de notas por materia/periodo
- [ ] Cálculo automático de promedios
- [ ] Generación de boletines
- [ ] Historial académico

### Fase 5: Observador del Estudiante

- [ ] Registro de observaciones (positivas/negativas)
- [ ] Categorización (académico, disciplinario, convivencia)
- [ ] Compromisos y seguimientos
- [ ] Reportes para acudientes

### Fase 6: Agenda Escolar

- [ ] Publicación de tareas
- [ ] Calendario de evaluaciones
- [ ] Eventos institucionales
- [ ] Recordatorios automáticos

### Fase 7: Dashboards y Reportes

- [ ] Dashboard director: KPIs institucionales
- [ ] Dashboard docente: Resumen de cursos
- [ ] Reportes de asistencia
- [ ] Reportes académicos
- [ ] Exportación PDF/Excel

### Fase 8: Notificaciones

- [ ] Push notifications (Firebase)
- [ ] Email notifications
- [ ] Notificaciones in-app
- [ ] Preferencias de usuario

---

## Estructura del Proyecto
```
lumina-api/
├── scripts/
│   ├── seed-institutions.ts       # Seed Green Valley School
│   └── seed-super-admin.ts        # Seed Super Admin
│
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   └── joiSchema.ts       # Validaciones Joi
│   │   │
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.module.ts
│   │   │   └── joiSchema.ts
│   │   │
│   │   └── institutions/
│   │       ├── institutions.controller.ts
│   │       ├── institutions.service.ts
│   │       └── institutions.module.ts
│   │
│   ├── shared/
│   │   ├── decorators/
│   │   │   ├── tenant.decorator.ts       # @TenantId()
│   │   │   └── get-user.decorator.ts     # @GetUser()
│   │   │
│   │   ├── dtos/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   └── institutions/
│   │   │
│   │   ├── guards/
│   │   │   ├── jwt.guard.ts
│   │   │   ├── tenant.guard.ts
│   │   │   ├── account-active.guard.ts
│   │   │   └── super-admin.guard.ts
│   │   │
│   │   ├── interfaces/
│   │   │   ├── decodeJWT.ts
│   │   │   └── authenticatedRequest.interface.ts
│   │   │
│   │   ├── middlewares/
│   │   │   └── logger.middleware.ts
│   │   │
│   │   ├── pipes/
│   │   │   └── joiValidationPipe.ts
│   │   │
│   │   ├── providers/
│   │   │   └── resend.provider.ts
│   │   │
│   │   ├── schemas/
│   │   │   ├── base-tenant.schema.ts
│   │   │   ├── institution.schema.ts
│   │   │   └── user.schema.ts
│   │   │
│   │   ├── templates/
│   │   │   ├── code_verification.html
│   │   │   └── register_success.html
│   │   │
│   │   └── utils/
│   │       ├── generateJWT.ts
│   │       ├── decodeJWT.ts
│   │       ├── generateOTP.ts
│   │       └── hashPassword.ts
│   │
│   ├── app.module.ts
│   ├── main.ts
│   └── contants.ts
│
├── .env.example
├── .gitignore
├── nest-cli.json
├── package.json
├── README.md
├── tsconfig.json
└── yarn.lock
```

---

## Stack Tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **NestJS** | ^10.0.0 | Framework backend |
| **TypeScript** | ^5.1.3 | Lenguaje |
| **MongoDB** | ^6.0 | Base de datos |
| **Mongoose** | ^8.3.2 | ODM |
| **JWT** | ^9.0.2 | Autenticación |
| **bcrypt** | ^5.1.1 | Hash de contraseñas |
| **Joi** | ^17.12.3 | Validación de datos |
| **Resend** | ^6.0.1 | Servicio de emails |
| **Luxon** | ^3.4.4 | Manejo de fechas |
| **Swagger** | ^7.3.1 | Documentación API |

---

## Licencia

Este proyecto es privado y propiedad de **Lumina Tech**.

---

## Enlaces Útiles

- [Documentación NestJS](https://docs.nestjs.com/)
- [Documentación MongoDB](https://docs.mongodb.com/)
- [Documentación Swagger](https://swagger.io/docs/)
- [Resend Docs](https://resend.com/docs)

---

**Estado del proyecto:** 🟢 Fase 1 completada - Listo para Fase 2 (Estructura Académica)

**Última actualización:** Febrero 2026
