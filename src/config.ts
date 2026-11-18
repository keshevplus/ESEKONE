import 'dotenv/config';
import { z } from 'zod';
import { parseEsekoneDatabaseTarget } from './db/database-target.js';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().url().optional(),
  DATABASE_MIGRATION_URL: z.string().url().optional(),
  ESEKONE_DATABASE_HOST: z.string().trim().min(1).optional(),
  ESEKONE_DATABASE_NAME: z.string().trim().min(1).optional(),
  OIDC_ISSUER: z.string().url().optional(),
  OIDC_AUDIENCE: z.string().trim().min(1).optional(),
  OIDC_JWKS_URL: z.string().url().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(
    'Invalid environment configuration: ' +
      parsed.error.issues.map((issue) => issue.path.join('.') + ': ' + issue.message).join('; '),
  );
}

const values = parsed.data;
const hasDatabaseUrl = Boolean(values.DATABASE_URL || values.DATABASE_MIGRATION_URL);
if (hasDatabaseUrl) {
  if (!values.ESEKONE_DATABASE_HOST || !values.ESEKONE_DATABASE_NAME) {
    throw new Error('ESEKONE_DATABASE_HOST and ESEKONE_DATABASE_NAME are required with database URLs');
  }
  const urls = [values.DATABASE_URL, values.DATABASE_MIGRATION_URL].filter((url): url is string => Boolean(url));
  for (const url of urls) {
    parseEsekoneDatabaseTarget(url, values.ESEKONE_DATABASE_HOST, values.ESEKONE_DATABASE_NAME, values.NODE_ENV);
  }
}

const oidcValues = [values.OIDC_ISSUER, values.OIDC_AUDIENCE, values.OIDC_JWKS_URL];
if (oidcValues.some(Boolean) && !oidcValues.every(Boolean)) {
  throw new Error('OIDC_ISSUER, OIDC_AUDIENCE and OIDC_JWKS_URL must be configured together');
}

export const config = {
  ...values,
  corsOrigins: values.CORS_ORIGINS.split(',').map((value) => value.trim()).filter(Boolean),
  isProduction: values.NODE_ENV === 'production',
};