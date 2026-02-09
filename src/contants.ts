import { config } from 'dotenv';

// Dot env config
config({});

export default {
  MONGO_STRING_CONNECTION: process.env.MONGO_STRING_CONNECTION,
  MONGO_DB_NAME: process.env.MONGO_DB_NAME,
  PORT: process.env.PORT ?? 3000,
  JWT_SECRET: process.env.JWT_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  projectName: 'Lumina Api',
};
