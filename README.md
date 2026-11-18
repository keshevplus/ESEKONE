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

## Engineering
- Keep production data and credentials out of source control.
- Use a separate database and migration history for ESEKONE.
- Enforce tenant scope server-side on every read and write.
- Treat client-provided tenant IDs as untrusted.
- Never let an agent bypass authorization or approval policies.
- Run tests and security checks before promoting a release.
- Feature branches do not trigger preview deployments by default. Integrate on `dev`, then promote a tested release to `main`.

## Status
This repository is the clean foundation for the ESEKONE platform. See [the delivery backlog](TODO.md) and [architecture](docs/ARCHITECTURE.md).
