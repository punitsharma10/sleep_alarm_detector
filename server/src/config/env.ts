import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT ?? 5000),
  mongoUri: required('MONGO_URI', 'mongodb://localhost:27017/sleep_alarm_detector'),
  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'dev-access-secret'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
    accessExpires: process.env.JWT_ACCESS_EXPIRES ?? '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES ?? '7d',
  },
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  superAdmin: {
    email: process.env.SUPERADMIN_EMAIL ?? 'superadmin@example.com',
    password: process.env.SUPERADMIN_PASSWORD ?? 'change-me-super-admin',
    name: process.env.SUPERADMIN_NAME ?? 'Super Admin',
  },
} as const;
