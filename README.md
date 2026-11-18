# ESEKONE

**The One Stop for Your Business.**

ESEKONE is a modular Business Operating System delivered as a multi-tenant SaaS. It brings customer relationships, sales, projects, work, communication, commerce, automation, analytics and AI-assisted operations into one configurable workspace.

## Product principles
- **Business-neutral:** serve service businesses, clinics, agencies, retailers, online stores, digital services, game studios and other organizations without hard-coded industry assumptions.
- **Tenant-first:** every customer operates in an isolated workspace with explicit authorization boundaries.
- **Modular:** organizations enable only the capabilities they need.
- **Human-governed AI:** agents operate with scoped tools, auditable actions and approval gates for sensitive operations.
- **International by design:** translation keys, locale-aware formatting, RTL/LTR layouts and accessible interfaces.
- **Secure by default:** least privilege, secure sessions, encryption, auditability, tested recovery and continuous security checks.

## Repository map
- `ESEKONE` — platform services, APIs, data model, automation and AI orchestration.
- `ESEKONE-web` — authenticated customer workspace application.
- `ESEKONE-lp` — public product website and conversion journeys.

## Core domains
Identity and access · Organizations and workspaces · Subscription and entitlements · CRM · Sales · Projects · Tasks · Calendar · Catalog and orders · Inventory · Documents · Communications · Workflow automation · Analytics · AI agents · Audit and security.

## Database roles
ESEKONE uses Neon managed PostgreSQL:
- `DATABASE_URL` connects to the Neon **pooled** endpoint using the restricted `esekone_app` role.
- `DATABASE_MIGRATION_URL` connects to the Neon **direct** endpoint using the separate `esekone_migrator` role.
- `DATABASE_APP_ROLE=esekone_app` lets the migration runner verify the runtime identity.
- Development and production must use separate Neon branches and distinct credentials.
- The runtime role must not own application tables, be a superuser, or have `BYPASSRLS`; migrations force row-level security on tenant tables.

See [Neon provisioning and operations](docs/NEON_SETUP.md) before configuring an environment. Never commit connection strings or credentials.

## Current API surface
- `GET /v1/me` — authenticated identity and workspace memberships.
- `POST /v1/onboarding/workspaces` — create an organization and its first owner workspace.
- `GET /v1/workspaces/:workspaceId/overview` — tenant-scoped live counts and recent contacts/tasks.
- `/v1/workspaces/:workspaceId/contacts` — tenant-scoped contact CRUD.
- `/v1/workspaces/:workspaceId/projects` — tenant-scoped project CRUD.
- `/v1/workspaces/:workspaceId/tasks` — tenant-scoped task lifecycle, events and agent handoffs.
- `/internal/agent-requests` — separately token-authenticated worker claim/completion/failure contract with lease recovery.\n\n## AI review worker\n\nThe standalone `npm run worker` process polls the internal queue and uses the OpenAI Responses API to generate specialist task reviews. It is deliberately **review-only**: the model has no customer-data tools and cannot change business records, deploy software, or contact people. A successful run attaches its review to the task and moves it to `review` (or `blocked` when information is missing); a failed run records a failure and blocks the task.\n\nBuild first with `npm run build`, then run `npm run worker` in a persistent worker/container service. Configure `AGENT_WORKER_API_URL`, the same `AGENT_WORKER_TOKEN` as the API, `OPENAI_API_KEY` and `OPENAI_MODEL` as server-side secrets. The worker does not need direct Neon credentials. It is not a Vercel serverless function and should not be started inside an HTTP request handler. A missing provider key/model prevents worker startup; it does not silently fall back to a fake response.

## AI review worker

The standalone `npm run worker` process polls the internal queue and uses the OpenAI Responses API to generate specialist task reviews. It is deliberately **review-only**: the model has no customer-data tools and cannot change business records, deploy software or contact people. A successful run attaches its review to the task and moves it to `review` (or `blocked` when information is missing); a failed run records a failure and blocks the task.

Build first with `npm run build`, then run `npm run worker` in a persistent worker/container service. Configure `AGENT_WORKER_API_URL`, the same `AGENT_WORKER_TOKEN` as the API, `OPENAI_API_KEY` and `OPENAI_MODEL` as server-side secrets. The worker does not need direct Neon credentials. It is not a Vercel serverless function and should not be started inside an HTTP request handler. Missing provider credentials prevent worker startup; they do not silently fall back to a fake response.

## Engineering
- Keep production data and credentials out of source control.
- Use separate Neon branches and role credentials for dev and production.
- Enforce tenant scope server-side on every read and write.
- Treat client-provided tenant IDs as untrusted.
- Never let an agent bypass authorization or approval policies.
- Run tests and security checks before promoting a release.
- Feature branches do not trigger preview deployments by default. Integrate on `dev`, then promote a tested release to `main`.

## Status
This repository is the platform foundation. Several business modules and runtime integrations are still in progress. See [the delivery backlog](TODO.md), [release gates](docs/RELEASE_GATES.md), [Neon setup](docs/NEON_SETUP.md) and [architecture](docs/ARCHITECTURE.md).
