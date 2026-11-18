# ESEKONE database and tenant isolation

## Hard boundary

ESEKONE must use its own PostgreSQL/Neon project and its own database. Do not point any ESEKONE environment at a KeshevPlus, clinic, agency, or other business database. Do not clone a legacy database, backup, migration ledger, upload bucket, or production credentials.

The application refuses database URLs unless both `ESEKONE_DATABASE_HOST` and `ESEKONE_DATABASE_NAME` are set and the URL host/path match exactly. The database name must begin with `esekone` (for example `esekone`, `esekone_dev`, or `esekone_prod`). Production cannot use localhost or example hosts.

## Separate credentials

Use two separate PostgreSQL roles:

- **Runtime role** — stored as `DATABASE_URL`. It is a non-superuser, not the table owner, has no `BYPASSRLS`, and receives only the grants required by the running API.
- **Migration role** — stored as `DATABASE_MIGRATION_URL`. It owns the schema/tables and can apply the ordered SQL migrations. It is never used by application request handlers.

Never grant the runtime role `SUPERUSER`, `BYPASSRLS`, or schema/table ownership. Do not share the migration password with Vercel Preview or client-side code.

Example environment configuration (values are placeholders; use the host and database from the new ESEKONE Neon project):

```dotenv
ESEKONE_DATABASE_HOST=ep-your-esekone-host.neon.tech
ESEKONE_DATABASE_NAME=esekone
DATABASE_URL=postgresql://esekone_app:...@ep-your-esekone-host.neon.tech/esekone?sslmode=require
DATABASE_MIGRATION_URL=postgresql://esekone_migrator:...@ep-your-esekone-host.neon.tech/esekone?sslmode=require
```

The host and database name checks run at process startup for configured URLs and again when a connection is used. The migration runner checks the connected database name before creating its migration ledger or applying SQL.

## Ordered migrations

Migrations live in `migrations/` and are applied in `src/db/migrate.ts` in strict order. Migrations run transactionally and are recorded in `esekone_migrations`. Do not use an ORM schema-push command against production.

Current foundation migrations:

1. `0000_initial_schema.sql` — users, organizations, workspaces, memberships, audit events.
2. `0001_tenant_security.sql` — workspace, organization, membership and audit read policies.
3. `0002_contacts.sql` — generic workspace-scoped CRM contacts and policies.
4. `0003_force_tenant_rls.sql` — FORCE RLS, owner self-read policy, append-only audit insert policy.

## Tenant context

The browser never chooses its own authority. The API validates the OIDC token, resolves its subject to an active ESEKONE user under an identity-scoped RLS context, then checks active workspace membership inside the same database transaction before setting `app.workspace_id`. Only then may tenant-scoped work execute.

All tenant-owned queries run inside `withWorkspaceContext`. Missing membership, malformed IDs, missing tenant context or cross-tenant access fail closed. RLS is defense in depth; application code still includes explicit workspace filters for updates/deletes.

The runtime role is not a table owner, and RLS is forced on tenant tables so even table owners cannot bypass policies. The application role has no direct ability to create workspaces or memberships; onboarding will use a separately audited provisioning workflow.

## CI database integration tests

CI uses an ephemeral PostgreSQL service, not a persistent customer database. It creates a non-privileged runtime role, applies migrations with the service migration identity, grants only required runtime access, and tests that:

- a member can read and mutate records in their own workspace;
- a non-member cannot establish workspace context;
- a workspace A query cannot return workspace B records;
- attempts to insert/update records into workspace B under workspace A context are rejected by RLS;
- users are visible only through their verified identity or own user ID;
- RLS is still enforced for the application role, including when it is not the table owner.

Do not load real customer data into CI fixtures. Integration tests create synthetic records with unique run-scoped names and clean them up.

## Provisioning status

The ESEKONE schema and guardrails are in source control. A dedicated managed Neon database has **not** been provisioned or connected yet. Do not run migrations until the new ESEKONE-only Neon project and connection strings are available and the host/database checks match.
