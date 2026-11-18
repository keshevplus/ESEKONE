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
- `ESEKONE` — platform services, admin console, APIs, data model, automation and AI orchestration.
- `ESEKONE-web` — authenticated customer workspace application.
- `ESEKONE-lp` — public product website and conversion journeys.

## Core domains
Identity and access · Organizations and workspaces · Subscription and entitlements · CRM · Sales · Projects · Tasks · Calendar · Catalog and orders · Inventory · Documents · Communications · Workflow automation · Analytics · AI agents · Audit and security.

## Database roles
- `DATABASE_MIGRATION_URL` uses a separate schema-owner role for ordered migrations.
- `DATABASE_URL` uses a separate runtime role named by `DATABASE_APP_ROLE`.
- The runtime role can only read its own verified identity row and must not own application tables, be a superuser, or have `BYPASSRLS`; migrations grant it only data access and force row-level security on tenant tables.
- Create the runtime role before running migrations. Never use a schema-owner connection string as the application runtime URL.

## Current API surface
- `GET /v1/me` — authenticated identity and workspace memberships.
- `POST /v1/onboarding/workspaces` — create an organization and its first owner workspace.
- `GET /v1/workspaces/:workspaceId/overview` — tenant-scoped live counts and recent contacts/tasks.
- `/v1/workspaces/:workspaceId/contacts` — tenant-scoped contact CRUD.
- `/v1/workspaces/:workspaceId/projects` — tenant-scoped project CRUD.
- `/v1/workspaces/:workspaceId/tasks` — tenant-scoped task lifecycle, events and agent handoffs.
- `/internal/agent-requests` — separately token-authenticated worker claim/completion contract.

## Engineering
- Keep production data and credentials out of source control.
- Use a separate database and migration history for ESEKONE.
- Enforce tenant scope server-side on every read and write.
- Treat client-provided tenant IDs as untrusted.
- Never let an agent bypass authorization or approval policies.
- Run tests and security checks before promoting a release.
- Feature branches do not trigger preview deployments by default. Integrate on `dev`, then promote a tested release to `main`.

## Status
This repository is the clean foundation for the ESEKONE platform. See [the delivery backlog](TODO.md), [release gates](docs/RELEASE_GATES.md) and [architecture](docs/ARCHITECTURE.md).
