import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development','test','production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().url().optional(),
});
const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  throw new Error('Invalid environment configuration: ' + parsed.error.issues.map(i=>i.path.join('.')+': '+i.message).join('; '));
}
export const config = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGINS.split(',').map(s=>s.trim()).filter(Boolean),
  isProduction: parsed.data.NODE_ENV === 'production',
};
