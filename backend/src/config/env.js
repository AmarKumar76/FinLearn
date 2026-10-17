import dotenv from 'dotenv';
dotenv.config();

/**
 * Validates and exposes strictly typed environment configuration
 * Fails fast if critical variables are corrupted
 */
export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/finlearn',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'finlearn_dev_jwt_secret_must_be_changed_in_prod_32char',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieMaxAgeDays: parseInt(process.env.COOKIE_MAX_AGE_DAYS || '7', 10),
  geminiApiKey: process.env.GEMINI_API_KEY || '',
};

/**
 * Validates environment configuration during server initialization
 */
export function validateEnv() {
  const errors = [];

  if (isNaN(config.port) || config.port <= 0 || config.port > 65535) {
    errors.push('PORT must be a valid port number between 1 and 65535.');
  }

  if (config.isProduction) {
    if (!process.env.MONGODB_URI) {
      errors.push('MONGODB_URI is required in production environment.');
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long in production environment.');
    }
    if (config.mongodbUri.includes('127.0.0.1') || config.mongodbUri.includes('localhost')) {
      console.warn('[CONFIG WARNING] MONGODB_URI is pointing to localhost in production mode.');
    }
  }

  if (errors.length > 0) {
    console.error('CRITICAL CONFIGURATION ERROR(S):');
    errors.forEach((err) => console.error(`  - ${err}`));
    throw new Error('Environment configuration validation failed.');
  }

  return true;
}

export default config;
