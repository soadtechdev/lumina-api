import * as bcrypt from 'bcrypt';

async function hashPassword(password: string): Promise<string> {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    return hashedPassword;
  } catch (error) {
    throw error;
  }
}

async function validatePassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    const result = await bcrypt.compare(password, hashedPassword);

    return result;
  } catch (error) {
    throw error;
  }
}

export { hashPassword, validatePassword };
