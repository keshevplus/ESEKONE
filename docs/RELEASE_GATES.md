# ESEKONE release gates

This policy applies only to the three ESEKONE repositories:
- `keshevplus/ESEKONE` — platform/API
- `keshevplus/ESEKONE-web` — authenticated workspace
- `keshevplus/ESEKONE-lp` — public marketing site

KeshevPlus repositories are not part of this release flow.

## Safe to merge into dev

A change is eligible for `dev` only when:
1. The PR targets `dev`, is mergeable and has no unresolved review or security findings.
2. The relevant repository's full CI passes on the exact PR head SHA.
3. Typecheck, tests and production build pass. Core additionally runs migrations and tenant-isolation tests against PostgreSQL with a separate runtime role.
4. No secrets, production credentials or customer data are added to source control.

After merge, verify the resulting `dev` SHA and its post-merge CI run. Deploy `dev` only when the deployment environment is intentionally configured for integration testing.

## Neon environment model

Neon is the selected managed PostgreSQL provider. Use separate Neon branches for ESEKONE `dev` and `production`; do not share live production customer data with development.

For each branch:
- API requests use `DATABASE_URL` with the Neon pooled endpoint and the restricted `esekone_app` role.
- Schema migrations use `DATABASE_MIGRATION_URL` with the direct (unpooled) endpoint and the separate `esekone_migrator` role.
- `DATABASE_APP_ROLE` must match the role used by `DATABASE_URL`.
- Both endpoints must target the same database and branch within that environment.
- Keep TLS enabled and store both connection strings only in protected server-side secrets.

Provisioning steps, role SQL and verification queries are in [NEON_SETUP.md](NEON_SETUP.md).

## Safe to promote into main

A green PR is necessary but not sufficient. Promote only when all three ESEKONE `dev` branches are validated and:
1. Dedicated Neon `dev` and `production` branches exist, with separate credentials and successfully applied ordered migrations.
2. The runtime database role is separate from the migration owner, does not own tables, is not superuser and has no `BYPASSRLS`.
3. OIDC issuer, audience, JWKS and verified-email claims are configured; the web client has matching authority, client ID and registered callback/logout URLs.
4. API CORS origins, Vercel environment variables, domains and health checks are configured for the intended environments.
5. Real end-to-end tests pass for sign-in, onboarding, workspace membership, tenant isolation, contacts, projects, tasks and agent-worker authorization against Neon.
6. Backup and restore procedures have been tested; production monitoring and rollback are ready.
7. All three `dev` commits are the exact release candidates being promoted. Use PRs to promote them; do not push directly to `main`.

After promotion, verify production health and confirm `dev` and `main` point to the same release. Back-merge any emergency main fix into dev immediately.

## Deployment cost controls

- Do not create a preview deployment for every feature-branch commit.
- Keep CI independent from Vercel deployments.
- Deploy only intentional `dev` integration releases and approved `main` production releases.
- Do not create/link Vercel projects until their Git deployment settings can enforce this policy.
- Never trigger a production deployment just to test a build; CI is the build gate.

## Current verified state

- Core CI includes a PostgreSQL 16 service, schema-owner migrations, a restricted runtime role, and authenticated cross-tenant isolation tests.
- Neon has been selected, but no Neon project/branch provisioning or live Neon connection test has yet been verified.
- The web workspace has an OIDC sign-in bootstrap and live overview API integration; environment values and identity-provider registration are still required.
- A passing CI run does not imply that managed database, OIDC, Vercel deployment, production-domain or backup setup has been completed.
