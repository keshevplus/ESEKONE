# AGENTS.md

Instructions for any person or AI agent working in the ESEKONE repositories. Read these first: [business plan](docs/ESEKONE_BUSINESS_PLAN.md), [architecture](docs/ARCHITECTURE.md), [release gates](docs/RELEASE_GATES.md), [delivery factory](docs/DELIVERY_FACTORY.md) and the [backlog](TODO.md).

This repository is public. Never commit secrets, connection strings, customer data or private business details.

## The owner's standing direction

- **ESEKONE is a modular SaaS factory and, eventually, the owner's infrastructure.** One codebase serves many workspaces. A workspace can look completely different from another (brand, template, labels, enabled modules) and still has the full admin and backend capability. Features are modules that can be added or removed per workspace; do not fork per customer.
- **Parity with KeshevPlus, rebuilt cleanly.** Every capability of the KeshevPlus admin and backend gets an ESEKONE home (core feature or module). The map and gaps are in section 3.3 of the business plan. Rebuild them from scratch as generic modules. Never copy KeshevPlus data, secrets, connection strings or clinic-specific code, and never point ESEKONE at the KeshevPlus database. KeshevPlus keeps running separately until a migration is independently verified.
- **Hosting path.** Static preview pages first (labelled synthetic content only), then a dev runtime on a dedicated Neon `dev` branch, then a proper domain on `main` with a separate `production` branch. Static hosting cannot run the API or database; do not describe a static preview as a working back office.
- **Generic core, industry as modules.** No clinic, shop or game logic in shared code. Do not scatter business-type checks through the core.
- **Tenant isolation from the server.** Derive workspace membership from authenticated identity. Never trust a tenant id from the browser. Scope queries, files, jobs, webhooks, notifications, AI context and audit records by workspace. Prove isolation with automated cross-tenant tests; a failing test blocks release.
- **Synthetic data is labelled.** AI may draft demo content. It is stored with a synthetic marker, visibly labelled, editable and removable in bulk. Never invent real customers, reviews, testimonials, payments or analytics.
- **Two money flows.** ESEKONE subscription billing is separate from each merchant's customer payments (Stripe Connect). Server-side secrets, verified idempotent webhooks, tenant-bound reconciliation. Never store card data. Live payments stay off until the security and reconciliation gates pass.
- **AI is governed.** Scoped tools, budgets, audit, and human approval for sensitive actions. AI review is advisory; a human approves changes to authentication, permissions, schema, workflows and customer-data paths. AI-simulated QA is labelled and never counted as executed test evidence.

## Standing product requirements

- **Every record shows when it happened.** Lists of bugs, todos, tasks, release notes, audit entries and similar show created and last-updated date and time, in the workspace time zone and locale, using a real `<time>` element. Release-note entries carry a date and time (`## YYYY-MM-DD HH:MM: Title`). Missing times show as unknown, never guessed.
- **Responsive, RTL and LTR.** Verify layouts at 320, 360/375, 768, 1024 and desktop widths in both directions. Stack columns on narrow screens, use `min-w-0` and `minmax(0,1fr)`, keep normal word wrapping, and apply break rules only to long identifiers and URLs. Normal labels must never wrap one letter per line.
- **Translation keys, not hard-coded copy.** Every user-facing string has a key with an ESEKONE fallback.

## How to work

- Small vertical slices. Keep code typed and DRY; inspect existing structure before adding. No monolithic rewrites, no duplicated business forks, no unrelated dependency upgrades.
- Every slice needs tests, docs, a recorded status and a verified deployment before it is called done. Statuses mean what they say: Planned, Implemented, Tested, Verified, Done. Never claim a test, deployment or review that did not happen.
- Record work in [TODO.md](TODO.md) with the `EKO-` ids. A task is `done` only with implementation evidence and passing relevant tests.
- Verify with the narrowest check first, then the CI checks. After two failed fixes, stop and reassess the cause.

## Release flow

Feature branch (no automatic preview deployment) → pull request to `dev` → CI and independent review → verify on `dev` → promote to `main` by pull request. Never push to `main` directly or force-push `dev` or `main`. Follow [RELEASE_GATES.md](docs/RELEASE_GATES.md) for when a change may merge and be promoted. Production changes need explicit owner authorization. Keep ESEKONE deployments, domains, credentials and database separate from KeshevPlus.

Commit and push only when asked. Stage named files; do not use `git add -A` or `git add .`.

## Final reports

Concise and factual: what changed, which checks ran and their results, commit and deployment status, and open risks. State what was not verified.
