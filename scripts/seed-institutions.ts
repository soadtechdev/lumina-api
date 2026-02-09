// scripts/seed-institutions.ts

import { connect, connection } from 'mongoose';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

// Importar el schema
import { InstitutionSchema } from '../src/shared/schemas/institution.schema';

async function seedInstitutions() {
  try {
    // Conectar a MongoDB
    const mongoUri = process.env.MONGO_STRING_CONNECTION;
    const dbName = process.env.MONGO_DB_NAME;

    if (!mongoUri || !dbName) {
      throw new Error('MongoDB connection string or database name not found in .env');
    }

    await connect(mongoUri, { dbName });
    console.log('✅ Connected to MongoDB');

    // Crear modelo
    const InstitutionModel = connection.model('Institution', InstitutionSchema); // 👈 CAMBIO AQUÍ

    const existingInstitution = await InstitutionModel.findOne({
      slug: 'greenvalley',
    });

    if (existingInstitution) {
      console.log('⚠️  Green Valley School already exists');
      console.log('Institution ID:', existingInstitution._id);
      process.exit(0);
    }

    // Crear Green Valley School
    const greenValley = new InstitutionModel({
      name: 'Green Valley School',
      slug: 'greenvalley',
      type: 'k12',
      status: 'active',
      email: 'admin@greenvalley.edu',
      phone: '+57 300 123 4567',
      address: 'Calle 123 #45-67',
      city: 'Bogotá',
      country: 'Colombia',
      primaryColor: '#10B981',
      logo: null,
      academicConfig: {
        currentAcademicYear: '2025',
        academicYearStart: new Date('2025-01-20'),
        academicYearEnd: new Date('2025-11-30'),
        gradeSystem: 'numeric',
        numericScale: {
          min: 1,
          max: 5,
          passingGrade: 3,
        },
      },
      limits: {
        maxStudents: 500,
        maxTeachers: 50,
        maxStorage: 5,
      },
      trialEndsAt: new Date('2025-12-31'),
      isActive: true,
    });

    await greenValley.save();

    console.log('✅ Green Valley School created successfully!');
    console.log('📋 Institution ID:', greenValley._id);
    console.log('📧 Email:', greenValley.email);
    console.log('🔗 Slug:', greenValley.slug);
    console.log('\n💡 Use this Institution ID as tenantId when registering users');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding institutions:', error);
    process.exit(1);
  }
}

seedInstitutions();
