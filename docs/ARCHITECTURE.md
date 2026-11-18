# Platform Architecture

## Target shape
ESEKONE is a modular, multi-tenant SaaS. The initial deployment may be a well-structured modular monolith; domain boundaries must remain explicit so high-load services can be extracted later without premature infrastructure complexity.

## Trust boundaries
1. Browser and external integrations are untrusted.
2. Authentication establishes a principal, not tenant authorization.
3. Workspace membership and role permissions are resolved server-side for every request.
4. Tenant context is derived from a validated membership/session, never trusted from arbitrary request payloads.
5. Background jobs and AI agents receive explicit tenant-scoped service identities and narrowly scoped tools.

## Domain modules
- Identity: users, credentials, MFA, sessions, invitations.
- Organization: tenants, workspaces, memberships, roles, custom fields.
- Commercial: plans, subscriptions, invoices, usage and entitlements.
- Business operations: CRM, sales, projects, tasks, calendar, catalog, orders, inventory.
- Collaboration: files, comments, notifications, communications.
- Automation: triggers, conditions, actions, schedules, retries and execution logs.
- Intelligence: reporting, event aggregation, AI agent runtime and evaluations.
- Governance: audit log, policy engine, security events and retention controls.

## Data isolation
Every tenant-owned record carries an immutable tenant/workspace key. All database access is tenant-scoped. Prefer database-enforced row-level security where supported, in addition to application authorization. Add automated negative tests that attempt cross-tenant reads, writes, exports, search and background-job access. Never use a shared default tenant.

## AI safety and governance
Agents use a central tool registry and policy layer. Each tool declares tenant scope, permissions, side effects, idempotency behavior and approval requirements. Read-only actions may be autonomous within scope. Financial, destructive, external-publication, permission-changing and production actions require policy checks and human approval. Record inputs, tool calls, outputs, approvals and evidence without logging secrets or unnecessary personal data.

## Security baseline
- Strong password hashing, MFA/passkeys, secure cookie sessions, CSRF protection where applicable.
- TLS in transit and encryption at rest; managed secrets, rotation and least privilege.
- Input validation, output encoding, parameterized queries, CSP and secure headers.
- Rate limits, bot/abuse controls, upload validation and malware scanning.
- Dependency, secret, static-analysis and container scans in CI.
- Tamper-resistant audit events, alerting, backup retention and tested restoration.
- OWASP ASVS-aligned review, threat modeling and independent penetration testing before broad production launch.

No system can be guaranteed immune to hacking. Security is an ongoing engineering and operational process, not a one-time checklist.

## Internationalization
All user-facing copy must use translation keys with meaningful ESEKONE fallbacks. Locale detection must be overridable by the user. Layouts must support RTL and LTR, localized dates/numbers/currency, and long translated strings.

## Release and operations
Feature branches are not deployed automatically. CI validates changes; `dev` is the integration environment; `main` is production. Promote tested commits, verify branch parity, monitor rollout health and maintain a documented rollback path.
