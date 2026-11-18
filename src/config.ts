import 'dotenv/config';
import { z } from 'zod';
const schema=z.object({
 NODE_ENV:z.enum(['development','test','production']).default('development'),
 PORT:z.coerce.number().int().min(1).max(65535).default(4000),
 CORS_ORIGINS:z.string().default('http://localhost:5173'),
 DATABASE_URL:z.string().url().optional(),
 DATABASE_MIGRATION_URL:z.string().url().optional(),
 DATABASE_APP_ROLE:z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/).optional(),
 OIDC_ISSUER:z.string().url().optional(),
 OIDC_AUDIENCE:z.string().optional(),
 OIDC_JWKS_URL:z.string().url().optional(),
 AGENT_WORKER_TOKEN:z.string().min(32).optional()
});
const parsed=schema.safeParse(process.env);
if(!parsed.success)throw new Error('Invalid environment configuration: '+parsed.error.issues.map(i=>i.path.join('.')+': '+i.message).join('; '));
export const config={...parsed.data,corsOrigins:parsed.data.CORS_ORIGINS.split(',').map(s=>s.trim()).filter(Boolean),isProduction:parsed.data.NODE_ENV==='production',agentWorkerConfigured:Boolean(parsed.data.AGENT_WORKER_TOKEN)};
