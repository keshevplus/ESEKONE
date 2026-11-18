# AGENTS.md — ESEKONE engineering contract

ESEKONE is a standalone, business-neutral, multi-tenant SaaS operating system. It serves clinics, professional services, websites, online shops, digital services, memberships, communities, gaming businesses and other organizations. It is one centrally maintained product with isolated workspaces and optional modules, not a collection of duplicated customer forks.

## Product direction

- Keep the core industry-neutral. Industry behavior belongs in modules with their own setup, navigation, permissions, schemas, events and tests.
- First-run onboarding collects business name, URL/domain, logo, business category, React/Vite site template, visual style, brand colors, locale, timezone, currency, enabled modules and initial owner. It is resumable and must never overwrite an established workspace.
- White-label the full admin and website experience: sidebar, terminology, dashboard cards, badges, page titles, metadata, notifications, email copy and available modules all come from workspace configuration and module manifests.
- Provide multiple genuinely different responsive site templates. Use shared components, design tokens and declarative manifests, not duplicated application copies. Never label a template "top converting" without measured experiment evidence.
- AI-generated setup content is synthetic, visibly marked, editable and bulk-removable. Never fabricate real customers, verified testimonials/reviews, real payments/orders or analytics. Keep synthetic records out of live reporting by default.
- CRM and task management are generic platform capabilities. QA is a first-class core module with its own issue fields, event history, no-duplicate linked fix task, agent sync, board/counters/filters, optional deduplicated CI filing and retest lifecycle: open → being fixed → ready to verify → verified. A failed retest reopens the same issue. A completed fix task only moves the bug to ready-to-verify; it never marks it verified. Fix work is routed to the owning module's task queue; the task manager does not implement fixes.
- Commerce is optional. Keep ESEKONE subscription billing separate from each merchant's customer-payment ledger. Stripe Connect uses tenant-bound connected accounts, server-side credentials, signed/idempotent webhooks, reconciliation and refunds. Never store card data. Live payments stay off until security, webhook, refund and reconciliation tests pass.
- AI agents use a shared registry and scoped tools. Every tool defines workspace scope, required permissions, read/write effect, idempotency, approval level and audit behavior. Financial, destructive, permission and production actions require approval.

## Database and tenant security (mandatory)

- ESEKONE has its own PostgreSQL/Neon project, database, backups, credentials, object storage, auth configuration, AI keys, Stripe configuration and Vercel project. Never reuse another business's database, connection string, Neon branch, snapshot, secrets, uploads or customer records.
- Resolve the tenant member on the server from a verified OIDC identity. Never trust a workspace ID in the browser as authorization.
- User lookup uses an identity-scoped RLS transaction. Workspace membership is checked in the same transaction before the workspace context is installed.
- All business queries, files, exports, search, AI context, jobs, webhooks, notifications and audit events are workspace-scoped. Missing identity, membership or context must fail closed.
- PostgreSQL RLS is defense in depth. Runtime role is a non-superuser, not table owner, and has no BYPASSRLS. Tenant tables use FORCE ROW LEVEL SECURITY. Migrations use a separate role. Never grant runtime schema ownership or migration privileges.
- Add negative cross-tenant tests for read/write/delete, joins, exports, files, webhooks, agent tools and background workers.
- Do not run migrations until ESEKONE host and database name have been explicitly configured and validated. Never use destructive schema push.

## Code quality

- Prefer a modular monolith. Keep clear domain boundaries; do not introduce microservices without measured need.
- Code DRY, typed, cohesive and testable. Reuse the shared authorization, database, UI and module systems. Avoid duplicate guards, giant route files, giant components and scattered business-type conditionals.
- Deliver small vertical slices with tests, docs and TODO status updated together. Avoid unrelated dependency upgrades and blind retries.
- Use strict request validation, parameterized SQL, least-privilege permissions, redacted errors, rate limits and audit trails.
- Responsive layouts must work at 320, 360/375, 768, 1024, 1280 and 1440+ pixels in RTL and LTR. Collapse multi-column layouts on phones. No ordinary label may become one-letter-per-line. Use min-w-0, minmax(0,1fr) and natural word wrapping; allow anywhere-breaking only for opaque IDs/URLs. Never globally apply overflow-wrap:anywhere to normal copy.
- Keep keyboard accessibility, visible focus, contrast, reduced motion and usable touch targets.

## Build and release

- Feature branches do not deploy previews by default. The Vercel ignore-build guard permits only dev and main.
- PRs target dev. CI, unit/integration tests, tenant isolation checks, security scan and independent review pass before merge.
- After merge to dev, wait for the exact commit's Vercel deployment to become READY, run live smoke tests, then automatically fast-forward that exact tested SHA to main.
- Verify production and confirm dev and main point to the same release. Retain a rollback target. Never force-push either branch.
- Avoid unnecessary deployments and blind retries. Keep feature branch builds in GitHub Actions.

## TODO and agent contract

- Keep TODO.md current. Use backlog, ready, in_progress, blocked, review, testing, done.
- A TODO is done only when implementation exists, tests pass and deployed behavior is verified when applicable. An AI statement is not evidence.
- Every agent report includes owner, objective, acceptance criteria, state, changed files, tests/results, evidence, risks and next action.
- QA findings remain distinct from fix tasks. Link and deduplicate the task, retain the event log, and verify only after a successful retest.

## Current priorities

1. Provision and verify a new ESEKONE-only managed database and runtime/migration roles.
2. Complete and test RLS isolation using the CI PostgreSQL service.
3. Complete the React/Vite admin, first-run business setup and template picker.
4. Add generic CRM, work/QA modules and AI tool registry.
5. Add optional commerce and Stripe Connect.
6. Add industry modules without hard-coding one industry into core.
7. Configure Vercel automatic dev deployment and gated promotion to main.
