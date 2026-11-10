import { encodeBase64, hash } from 'bcryptjs';
import { getRandomBytesAsync } from 'expo-crypto';

const BCRYPT_ROUNDS = 12;
const BCRYPT_SALT_BYTES = 16;

export async function hashPassword(password: string): Promise<string> {
  if (!password.trim()) {
    throw new Error('Mật khẩu không được để trống.');
  }

  const randomBytes = await getRandomBytesAsync(BCRYPT_SALT_BYTES);
  const salt = `$2b$${String(BCRYPT_ROUNDS).padStart(2, '0')}$${encodeBase64(randomBytes, BCRYPT_SALT_BYTES)}`;

  return hash(password, salt);
}
