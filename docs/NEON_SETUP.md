# Neon database setup

ESEKONE uses Neon as its managed PostgreSQL provider. Keep development and production data isolated in separate Neon branches. Do not point both environments at the same branch.

## Connection layout

Create a dedicated Neon project for ESEKONE, then use two branches:

| ESEKONE environment | Neon branch | Purpose |
| --- | --- | --- |
| Development | `dev` | Integration testing and test accounts |
| Production | `production` | Live customer data |

For each branch, configure two distinct database roles and connection strings:

| Variable | Role / endpoint | Use |
| --- | --- | --- |
| `DATABASE_URL` | `esekone_app`, pooled endpoint (`-pooler`) | API runtime queries |
| `DATABASE_MIGRATION_URL` | `esekone_migrator`, direct endpoint (no `-pooler`) | Ordered schema migrations |
| `DATABASE_APP_ROLE` | `esekone_app` | Expected runtime identity |

Both URLs must point to the same Neon branch and database for a given environment. The app and migration roles must be different. Never use the migration-owner URL as the API's `DATABASE_URL`.

Neon's pooled endpoint is intended for application traffic. The direct endpoint is used for migrations and administrative work that needs a stable PostgreSQL session. Keep TLS enabled in both URLs with `sslmode=require`; retain `channel_binding=require` when supplied by the Neon Console and supported by the installed PostgreSQL driver.

## Provision each branch

1. In the Neon Console, create/select the ESEKONE project and create the `dev` branch.
2. Select the branch's database and owner role in **Connect**. Copy the direct (unpooled) connection string for initial setup.
3. Connect with `psql` as the Neon owner. Use a password manager to generate two different high-entropy passwords; do not put them in Git, tickets, logs or chat.
4. Create the two ESEKONE roles. Replace the password placeholders locally:

```sql
CREATE ROLE esekone_migrator
  LOGIN PASSWORD '<unique-migration-password>'
  NOSUPERUSER NOCREATEDB NOCREATEROLE;

CREATE ROLE esekone_app
  LOGIN PASSWORD '<different-unique-runtime-password>'
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;

GRANT CONNECT ON DATABASE neondb TO esekone_migrator, esekone_app;
GRANT USAGE, CREATE ON SCHEMA public TO esekone_migrator;
GRANT USAGE ON SCHEMA public TO esekone_app;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM esekone_app;
```

Use the actual database name selected in the Neon Console instead of `neondb`. If either role already exists, rotate its password with `ALTER ROLE` rather than creating a duplicate.

5. In **Connect**, select `esekone_app`, enable connection pooling and copy that URL into the ESEKONE runtime `DATABASE_URL`.
6. Select `esekone_migrator`, disable connection pooling and copy that direct URL into `DATABASE_MIGRATION_URL`.
7. Set `DATABASE_APP_ROLE=esekone_app`.
8. Run the migration command from a trusted release environment:

```bash
npm ci
npm run db:migrate
```

The migration runner verifies the connected identities, rejects a runtime role that is a superuser, has `BYPASSRLS`, or owns application tables, then applies ordered migrations and grants the runtime role only the table/sequence privileges required by the app. Row-level security remains enforced by the migrations.

Repeat the process on the `production` branch with different passwords and production-only secrets. Do not copy development credentials into production.

## Verification before integration

Run the following as the Neon owner or migration role after migrations:

```sql
SELECT current_database(), current_user, version();

SELECT rolname, rolsuper, rolbypassrls, rolcreatedb, rolcreaterole
FROM pg_roles
WHERE rolname IN ('esekone_app', 'esekone_migrator');

SELECT tablename, rowsecurity, forcerowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Confirm that:
- the application connection logs in as `esekone_app`;
- the migration connection logs in as `esekone_migrator`;
- `esekone_app` is not a superuser, has no `BYPASSRLS`, and owns no application tables;
- tenant tables have row-level security enabled and forced;
- the API's `/health/ready` returns `200` with the configured runtime connection;
- cross-tenant read and write denial tests pass against the provisioned Neon branch, not only the CI PostgreSQL service.

Do not expose database URLs in health responses or logs. Treat them as secrets and rotate both roles independently if a credential is exposed.

## Vercel environment variables

Set these server-side variables for the ESEKONE API project separately in Vercel **Development/Preview** (for the approved `dev` integration deployment only) and **Production**:

- `DATABASE_URL`
- `DATABASE_MIGRATION_URL` (only in the protected release/migration environment; do not expose it to client bundles)
- `DATABASE_APP_ROLE`
- `NODE_ENV`
- `CORS_ORIGINS`
- OIDC variables documented in `.env.example`

Do not set database variables on `ESEKONE-web` or `ESEKONE-lp`. The browser must talk to the API and must never receive PostgreSQL credentials. Prefer a dedicated protected release job for migrations rather than running schema changes on every web deployment.

## Operational rules

- Use Neon branches to isolate development from production; never use production customer data in development.
- Run and verify migrations before deploying an API version that depends on them.
- Take/verify a recovery point before production schema changes and maintain a tested restore procedure.
- Keep application traffic on the pooled endpoint and migrations/backups on the direct endpoint.
- Do not use transaction-pooler connections for session-dependent operations such as `LISTEN/NOTIFY`, temp-table workflows or session-level `SET` state.
- Keep Neon credentials in Vercel encrypted environment variables or a managed secret store; never commit `.env` files.

## Separate AI review worker

The review worker runs as a separate, persistent process. It does not connect directly to Neon and must not receive either database URL.

Configure these server-side secrets/settings on the worker service:

- `AGENT_WORKER_API_URL` — HTTPS base URL of the ESEKONE API (for local development, `http://localhost:4000`).
- `AGENT_WORKER_TOKEN` — the same high-entropy internal token configured on the API; use separate values for dev and production.
- `OPENAI_API_KEY` — server-side OpenAI project key.
- `OPENAI_MODEL` — a model ID enabled for the OpenAI project.
- `AGENT_WORKER_POLL_INTERVAL_MS` — optional, defaults to `5000`.
- `AGENT_WORKER_LEASE_TIMEOUT_MS` — optional, defaults to `600000`; stale work is reclaimed up to its configured retry limit.

Build the core package and run `npm run worker` in the worker service. Deploy it as a long-running worker/container, not as a Vercel serverless function. The API and worker must use the same `AGENT_WORKER_TOKEN`; never expose it to the web app.

The current provider integration is **review-only**: it sends only the requested task prompt and task fields to the model and exposes no business-data or write tools. It produces a review/next action, never claims a task is complete, and never changes business records itself. The API records failed requests and reclaims abandoned worker leases after the configured timeout.

Do not set `OPENAI_API_KEY` or `AGENT_WORKER_TOKEN` as any browser `VITE_*` value. Use protected worker-service secrets and rotate them independently.
