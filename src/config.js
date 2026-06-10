import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  port: Number(process.env.PORT) || 4000,
  jwtSecret: process.env.JWT_SECRET || 'dev-only-insecure-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  dbFile: process.env.DB_FILE || path.join(__dirname, '..', 'data.db'),
  allowedOrigin: process.env.ALLOWED_ORIGIN || '*',
  saltRounds: 10,
};
