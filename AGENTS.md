# AGENTS.md — ESEKONE engineering contract

ESEKONE is a standalone, business-neutral, multi-tenant SaaS operating system. It serves clinics, professional services, websites, online shops, digital services, memberships, communities, gaming businesses and other organizations. It is one maintainable product with isolated workspaces and configurable modules, not a collection of duplicated customer forks.

## Product rules

- Keep the core industry-neutral. Industry behavior belongs in installable modules with their own setup, navigation, permissions, schemas, events and tests.
- First-run onboarding collects business name, website URL/domain, logo, business category, selected React/Vite template, brand palette, locale, timezone, currency, modules and initial owner. Setup is resumable and must never overwrite an established workspace.
- The full admin experience is white-label: sidebar, terms, badges, dashboard cards, page titles, metadata, messages, email copy, navigation and enabled modules come from workspace configuration and module manifests.
- Provide multiple genuinely different responsive site templates. Prefer reusable blocks, design tokens and declarative manifests over copied applications. Never call a template “top converting” without measured experiment data.
- AI-generated sample content is synthetic, visibly marked, editable and bulk-removable. Never fabricate live customers, verified testimonials, reviews, payments, orders, or analytics. Keep synthetic data out of live reporting by default.
- QA is a first-class core module. It has its own issue type, severity/environment/repository, reproduction steps, expected/actual result, evidence, reporter, event history, linked fix task, no-duplicate handoff, agent sync and retest lifecycle. Lifecycle: open → being fixed → ready to verify → verified. A failed retest reopens the same issue. Completing a linked fix task means ready to verify, never verified. Fix tasks route to the relevant module queue; the task manager does not implement fixes.
- Commerce is optional. Keep SaaS subscription billing separate from each merchant's customer-payment ledger. Stripe Connect uses tenant-bound connected accounts, server-held credentials, signed/idempotent webhooks, reconciliation and refunds. Never store card data. Live payments stay disabled until security, webhook, refund and reconciliation tests pass.
- AI agents use a shared registry and scoped tools. Every tool defines tenant, permissions, read/write effect, idempotency, approval level and audit behavior. Sensitive financial, destructive, permission and production operations require approval.

## Security and data isolation (mandatory)

- ESEKONE has its own PostgreSQL/Neon project, databases, credentials, object storage, auth configuration, AI keys, Stripe account and Vercel project. Never reuse an existing business's database, backups, secrets, uploads or customer data.
- Resolve workspace membership on the server from a verified authenticated identity. Never trust a workspace ID from the browser as authorization.
- Establish tenant context only after confirming an active membership in the same database transaction. Scope every query, write, export, file, search, webhook, background job, notification, audit event and AI context.
- Use PostgreSQL RLS as defense in depth. The runtime role must not be a superuser, table owner with RLS bypass, or have BYPASSRLS. Force RLS on tenant-owned tables where appropriate. Migrations run with a separate privileged credential.
- Never add a default/global workspace fallback. Missing tenant context must deny access.
- Add cross-tenant negative tests for list/read/create/update/delete, joins, exports, files, webhook events, agent tools and background jobs.
- Keep secrets out of source, logs, screenshots and generated demo data. Validate all environment variables at startup and fail closed when required security configuration is missing.

## Code quality and maintainability

- Prefer a modular monolith until measured scaling needs justify a service split. Keep clear domain boundaries and dependency direction.
- Code DRY, typed, cohesive and testable. Reuse existing services/components; do not duplicate logic in page components, giant route files or scattered business-type conditionals.
- Small vertical slices: implementation, tests, docs and backlog status together. No giant rewrite, unrelated dependency upgrades or blind retries.
- Database changes use ordered, additive SQL migrations. Do not use destructive schema push as a shortcut. Verify target host/database identity before migrations.
- API validation uses strict schemas. Use parameterized queries, least privilege, request IDs, rate limits, secure headers and redacted error responses.
- Admin and site layouts must work at 320, 360/375, 768, 1024, 1280 and 1440+ pixels, in both RTL and LTR. Multi-column layouts collapse on narrow screens. No normal label may shrink until it wraps one letter per line. Use min-w-0, minmax(0,1fr), natural word wrapping, and explicit anywhere-breaking only for long IDs/URLs. Never apply global overflow-wrap:anywhere to normal copy.
- Accessibility: keyboard support, semantic controls, visible focus, contrast, reduced motion, and appropriate touch targets.

## Delivery and deployment

- Feature branches do not create Vercel previews by default. Vercel deployments are restricted to dev and main using the repository's ignored-build guard.
- PRs target dev. CI, unit/integration tests, security checks and independent review must pass before merge.
- Push/merge to dev, wait for the exact commit's Vercel deployment to become READY, run live smoke checks, and only then automatically fast-forward that exact tested commit to main.
- After promotion, verify production and confirm dev and main point to the same release. If production verification fails, use the recorded rollback target.
- Never force-push dev or main. Keep branch history linear and reconcile emergency fixes.
- Do not create extra Vercel deployments for every feature commit or retry builds blindly.

## Backlog and task contract

- Keep TODO.md current. Each item records ID, status, acceptance criteria and evidence. Statuses: backlog, ready, in_progress, blocked, review, testing, done.
- A task is Done only after code exists, required checks pass, and deployed behavior is verified when deployment applies. An AI narrative is not evidence.
- Every task/agent report includes owner, objective, acceptance criteria, state, changed files, tests/results, evidence, risks and next action.
- QA findings should be recorded as QA issues; the fix task must be separate, linked and deduplicated. Retest determines verification.

## Current execution priorities

1. Finish the clean independent database provisioning and prove RLS isolation.
2. Complete secure owner/workspace bootstrap and first-run business setup.
3. Build the responsive React/Vite workspace admin and template picker.
4. Add generic CRM, tasks and QA modules with tenant-safe data access.
5. Add AI provider/tool registry and synthetic demo seeding.
6. Add optional commerce and Stripe Connect after tenant isolation and billing boundaries are proven.
7. Add industry packs without hard-coding one industry into the core.
