# ESEKONE database and tenant isolation

## Non-negotiable separation

ESEKONE uses its own PostgreSQL/Neon project, database, credentials, migration history and backups. Never point an ESEKONE environment at KeshevPlus, a clinic database, another customer's database or a legacy backup. Do not import real customer, patient or business data into the template.

The application validates every configured database URL against both `ESEKONE_DATABASE_HOST` and `ESEKONE_DATABASE_NAME`. The database name must begin with `esekone`; the URL host and database path must match exactly. Production URLs cannot use localhost or an example host.

## Separate database roles

Use two PostgreSQL roles:

- **Runtime role** — `DATABASE_URL`. Non-superuser, not a table owner, no `BYPASSRLS`. Grant only the runtime operations needed by API handlers.
- **Migration role** — `DATABASE_MIGRATION_URL`. Owns schema objects and runs the ordered migration set. It is not available to request handlers or frontend code.

Never grant the runtime role `SUPERUSER`, `BYPASSRLS`, or table ownership. Do not expose the migration password to Vercel Preview deployments, browser code, or the user-facing app.

Example managed database configuration (placeholders only):

```dotenv
ESEKONE_DATABASE_HOST=ep-your-esekone-host.neon.tech
ESEKONE_DATABASE_NAME=esekone
DATABASE_URL=postgresql://esekone_app:...@ep-your-esekone-host.neon.tech/esekone?sslmode=require
DATABASE_MIGRATION_URL=postgresql://esekone_migrator:...@ep-your-esekone-host.neon.tech/esekone?sslmode=require
```

Never copy an existing project's connection string or credentials. Validate the new project's host and database name before adding it to Vercel. The API checks `current_database()` at readiness time; the migration runner checks it before applying SQL.

## Ordered migrations

Migrations are applied transactionally by `src/db/migrate.ts` and recorded in `esekone_migrations`. The runner takes a PostgreSQL advisory lock to prevent concurrent migration processes. Do not use destructive schema push in a managed environment.

1. `0000_initial_schema.sql` — users, organizations, workspaces, memberships and audit events.
2. `0001_tenant_security.sql` — initial workspace/organization/membership/audit policies.
3. `0002_contacts.sql` — generic workspace-scoped CRM contacts.
4. `0003_work_items.sql` — workspace tasks, event log and agent requests.
5. `0004_workspace_bootstrap.sql` — first owner/workspace creation policy.
6. `0005_agent_worker_access.sql` — narrowly scoped global queue-worker policies.
7. `0006_projects.sql` — projects and tenant-safe work-item relationship.
8. `0007_force_tenant_rls.sql` — FORCE RLS for all tenant tables, identity-bound user lookup/creation and append-only audit insertion.

## Request authorization flow

1. Validate the OIDC token, issuer, audience, signature and verified email.
2. Resolve the local user only inside an identity-scoped transaction; RLS exposes only the row matching the verified OIDC subject.
3. Validate workspace membership inside the same transaction that establishes the workspace context.
4. Only after the active membership passes, set `app.workspace_id` and run the module action.
5. PostgreSQL RLS remains an additional boundary; queries also use explicit workspace predicates for writes and reads.

Missing identity, tenant context, user or active membership fails closed. The application never trusts a workspace ID supplied in the request as proof of membership.

## RLS policy model

- Users: only the verified identity subject or the current local user ID can read the row. Initial user insert must match the OIDC subject bound to the transaction.
- Workspaces/memberships: a user can list their active memberships; workspace data is visible only after membership context is established.
- Business tables: read/write policies are bound to `app.workspace_id`.
- Agent worker: separate bearer-token route sets a transaction-local worker context and sees only agent request/work item queue tables, never CRM contacts or user PII.
- Audit events: read within current workspace; append-only insert must match both current workspace and actor. No application update/delete policy.

`FORCE ROW LEVEL SECURITY` is enabled for all tenant tables so table owners are also subject to policies. The deployed runtime role must still be separate from the migration owner and must not be a superuser or have `BYPASSRLS`.

## CI database tests

CI should use an ephemeral PostgreSQL service, not a persistent business database. It should create a non-privileged runtime role, apply migrations with a separate service migration role, and run integration tests that prove:

- a user with active membership can access their own workspace;
- a non-member is denied before the workspace context is installed;
- workspace A cannot list or read workspace B's contacts, work items, projects or events;
- writes with another workspace ID fail under RLS;
- user identity lookup cannot read another identity's user row;
- the worker token can access queue/work item records but not CRM contacts;
- audit insert requires the active workspace and actor identity.

Use run-scoped synthetic fixtures only. Never place customer or patient data in CI.

## Provisioning status

The clean schema, database URL guard, identity context, membership enforcement and RLS hardening migration are committed in source. A dedicated managed ESEKONE database is **not yet provisioned or connected**. Do not run `npm run db:migrate` until the newly created ESEKONE Neon project is connected and its host/database values match the configured guard.
