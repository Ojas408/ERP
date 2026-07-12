const isProd = process.env.NODE_ENV === 'production';

const DEV_JWT_SECRET = 'dev_only_insecure_jwt_secret';

const configuredSecret = process.env.JWT_SECRET;

if (!configuredSecret && isProd) {
  throw new Error('JWT_SECRET is not set in environment variables');
}

if (!configuredSecret) {
  console.warn('WARNING: JWT_SECRET is not set; using an insecure development-only secret');
}

export const JWT_SECRET = configuredSecret || DEV_JWT_SECRET;
