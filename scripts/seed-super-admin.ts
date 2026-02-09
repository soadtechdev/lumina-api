import { connect, connection } from 'mongoose';
import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';

config();

import { UserSchema } from '../src/shared/schemas/user.schema';

async function seedSuperAdmin() {
  try {
    const mongoUri = process.env.MONGO_STRING_CONNECTION;
    const dbName = process.env.MONGO_DB_NAME;

    if (!mongoUri || !dbName) {
      throw new Error('MongoDB connection string or database name not found in .env');
    }

    await connect(mongoUri, { dbName });
    console.log('✅ Connected to MongoDB');

    const UserModel = connection.model('User', UserSchema);

    // Verificar si ya existe super admin
    const existingSuperAdmin = await UserModel.findOne({
      role: 'super_admin',
    });

    if (existingSuperAdmin) {
      console.log('⚠️  Super Admin already exists');
      console.log('Email:', existingSuperAdmin.email);
      process.exit(0);
    }

    // Crear Super Admin (sin tenantId porque es global)
    const hashedPassword = await bcrypt.hash('SuperAdmin123!', 10);

    const superAdmin = new UserModel({
      email: 'admin@lumina.tech',
      firstName: 'Super',
      lastName: 'Admin',
      password: hashedPassword,
      role: 'super_admin',
      accountStatus: 'active',
      isActive: true,
      tenantId: null,
    });

    await superAdmin.save();

    console.log('✅ Super Admin created successfully!');
    console.log('📧 Email: admin@lumina.tech');
    console.log('🔑 Password: SuperAdmin123!');
    console.log('⚠️  CHANGE THIS PASSWORD IN PRODUCTION!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding super admin:', error);
    process.exit(1);
  }
}

seedSuperAdmin();
