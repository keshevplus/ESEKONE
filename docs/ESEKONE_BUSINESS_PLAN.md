# ESEKONE Business Plan

**Status:** Draft v0.1 for owner review · 2026-11-21 · backlog statuses are taken from the `dev` branch of `TODO.md` on that date (`main` is behind `dev`)
**Product:** ESEKONE, "The One Stop for Your Business"
**Related documents:** [README](../README.md) · [Architecture](ARCHITECTURE.md) · [Release gates](RELEASE_GATES.md) · [Neon setup](NEON_SETUP.md) · [Delivery backlog](../TODO.md) · [Security policy](../SECURITY.md)

> **This repository is public.** This plan deliberately contains no prices, revenue figures, customer data, credentials or private business details. Anything marked **Decision needed** or **Assumption** is not settled. Nothing here is a measured result; where a number or a claim would need evidence, it says so instead of inventing one.

---

## 1. Purpose

ESEKONE is a modular business operating system sold as a multi-tenant SaaS. A business signs up, chooses what it needs, and gets its own branded site, admin, CRM and back office. It can switch features on and off as it grows, without anyone forking the code.

Eventually ESEKONE is **the infrastructure**: the one platform on which the owner's own businesses and any customer business run. Each of them looks different on the outside and runs on the same engine underneath.

The first proving ground is the KeshevPlus clinic application. It is the reference for what a complete admin and backend look like. It stays a separate, running product with its own database until a migration is independently verified. ESEKONE re-creates those capabilities as clean modules; it never copies KeshevPlus data, secrets or code that is specific to one clinic.

### Principles (from the README and architecture, restated)
1. **Business-neutral core, industry as modules.** No clinic, shop or game assumptions in the core.
2. **Tenant-first.** Every workspace is isolated. Tenant scope comes from authenticated membership on the server, never from the browser.
3. **Modular and removable.** A business enables only what it needs. Removing a module never breaks the core or leaks data.
4. **One codebase, many workspaces.** Customers are configured, not forked. A custom fork is a last resort, not the default.
5. **Human-governed AI.** Agents use scoped tools; sensitive actions need approval; nothing is invented.
6. **Honest evidence.** Statuses mean what they say. No claim ("top converting", "secure", "verified") without evidence.

---

## 2. Who it is for

ESEKONE is for small and mid-sized businesses that today stitch together a website, a spreadsheet CRM, a booking tool, a payment tool and a mailing tool. The first segments, in the order the platform is likely to serve them:

| Segment | What they need first | Module pack |
|---|---|---|
| Clinics and practices | Appointments, client records, forms, reminders, privacy controls | Clinics |
| Professional and online services | Leads, proposals, bookings, projects, invoicing | Services |
| Online stores | Catalog, orders, inventory, payments, refunds | Commerce |
| Content and brand sites | Pages, blog, media, newsletters, SEO | Content |
| Communities and memberships | Members, plans, gated content | Memberships |
| Game studios and communities | Community operations, in-game economy workflows (business operations only; a game runtime is out of scope unless scoped separately) | Gaming/community |

**Assumption:** the first paying segment after the owner's own clinic is other small practices and service businesses, because that is where the owner has direct operating experience. This should be tested with real conversations before it is relied on.

---

## 3. The product

### 3.1 Core (every workspace has this)
Identity and access · organizations and workspaces · roles and permissions · navigation shell and white-label branding · CRM primitives (people, organizations, activities) · tasks and projects · files and media · notifications · audit log · settings and configuration · plans and entitlements · AI control plane (providers, tool registry, budgets).

### 3.2 Optional modules
A module is an installable unit. Each declares its **routes, navigation items, permission keys, setup steps, migrations, events, AI tools and tests**, so adding or removing it is a configuration action, not a code edit in shared files.

| Module | What it adds |
|---|---|
| CRM extensions | Pipelines, custom fields, imports, timeline |
| Calendar and appointments | Scheduling, resources, reminders |
| Forms and intake | Public forms, spam control, routing into the CRM |
| Content and site | Pages, blocks, blog, media, publishing |
| Communications | Email, WhatsApp/chat, campaigns |
| Commerce | Catalog, cart, orders, inventory, discounts, refunds |
| Merchant payments | Stripe Connect onboarding and payments (separate from ESEKONE billing) |
| Memberships | Member plans and gated content |
| Marketing and ads reporting | Campaign and spend reporting, source attribution |
| Automation | Triggers, conditions, actions, retries |
| Reporting | Dashboards and exports |
| Clinics pack | Client records, intake and privacy controls specific to practices |
| Operations and QA | Todos, bugs, QA reports, release notes (the factory's own tooling, see section 7) |

### 3.3 The parity principle
**An ESEKONE site may look completely different from KeshevPlus and still have everything KeshevPlus's admin and backend can do.** The look comes from workspace configuration (brand, template, labels, enabled modules); the capability comes from the shared engine and the modules.

The table maps what the KeshevPlus application provides today to its ESEKONE home. The "ESEKONE status" column comes from the [delivery backlog](../TODO.md) on `dev` as of this draft; "not yet in backlog" is a gap to close, not a promise.

| KeshevPlus capability (reference) | ESEKONE home | ESEKONE status |
|---|---|---|
| Leads and clients | Core CRM, CRM extensions | In progress (EKO-020) |
| Tasks and work tracking | Tasks and projects | In progress (EKO-022) |
| Appointments | Calendar and appointments | In progress (EKO-023: task due-date calendar exists; appointments do not) |
| Orders and catalog | Commerce | Backlog (EKO-024) |
| Documents, email, messaging | Communications | Backlog (EKO-025) |
| Workflow rules | Automation | Backlog (EKO-026) |
| Revenue and ad reports | Reporting; Marketing and ads reporting | Backlog (EKO-027); ads reporting not yet in backlog |
| Admin AI assistant and agents | AI control plane and agents | In progress (EKO-030, EKO-031: a review worker exists; business tools and approvals remain) |
| Activity log | Audit log | In progress (EKO-014: event storage exists; admin search and UI remain) |
| Todo manager, bugs, QA, code audit | Operations and QA | Backlog (EKO-033); bugs, QA and audit not yet in backlog |
| Blog, articles, landing pages | Content and site | Marketing site in progress (EKO-042); content module not yet in backlog |
| Public forms and intake | Forms and intake | Not yet in backlog |
| Email campaigns | Communications | Not yet in backlog |
| Chat widget and WhatsApp | Communications | Not yet in backlog |
| Multiple languages, RTL and LTR | Translation framework | In progress (EKO-041: English and Hebrew, RTL and LTR on current screens) |
| Client records and privacy controls | Clinics pack | Not yet in backlog |

### 3.4 Customizing: add, remove and extend
In order of preference, so the platform stays maintainable:
1. **Configure.** Brand, template, labels, locale, time zone, currency, enabled modules.
2. **Enable or disable a module.** Entitlements control what a plan includes. Disabling hides the module and stops its jobs; data is retained for a defined period and exportable.
3. **Extend with a custom module** built against the same manifest contract, installed for one workspace.
4. **Dedicated deployment** for a large or regulated customer, as a later tier, using the same code.
5. **Fork** only if a customer explicitly requires it. Forks are not maintained by default.

Module removal must be tested like any feature: no orphaned navigation, no failing jobs, no cross-module schema break.

---

## 4. Where it runs: from first pages to a proper domain

**Assumption:** "Google pages first" means starting on free, Google- or GitHub-hosted static pages before buying a production domain. Please confirm which service is meant. The plan below works for either.

The important constraint: **static page hosting serves only files.** It cannot run the API, the database connection or the workspace backend. So the first stage can show the site and live previews, not the working back office.

| Stage | Where | What runs | Data | Gate to move on |
|---|---|---|---|---|
| **0. Static preview** | Free static hosting on a provided address | Public site and template previews (the `ESEKONE-lp` and `ESEKONE-web` front ends) with clearly labelled **synthetic** content | None real | Previews pass responsive and RTL/LTR checks; no real business data anywhere |
| **1. Dev runtime** | The platform's server runtime (`vercel.json` enables deployments only for `dev` and `main`; per the release gates, no Vercel project is created or linked until its Git settings enforce that) | The API and the authenticated workspace app (`ESEKONE-web`): onboarding, CRM, tasks, calendar, against a dedicated Neon project with a `dev` branch | Synthetic and test accounts only | EKO-002 and EKO-003 done: Neon provisioned, ordered migrations applied, cross-tenant isolation tests passing against it (today they run in CI on a PostgreSQL service) |
| **2. Proper domain** | A purchased domain, `main` as production on a separate Neon `production` branch | Full product for the first real workspaces, per-workspace custom domains | Real customer data | Every item under "Safe to promote into main" in [RELEASE_GATES.md](RELEASE_GATES.md) met, plus the security work EKO-050 to EKO-055: threat model, scanning, rate limits, tested backup restore, authorization penetration tests, load and recovery testing |
| **3. Scale** | Same code, extracted services or dedicated databases only where measured need appears | Heavy workloads (jobs, AI, reporting) separated | As above | Measured load or compliance need, not a guess |

**Where things stand:** per RELEASE_GATES.md, Neon is selected but no Neon project or branch has yet been provisioned or live-tested, so stage 1 has not started. Rules that apply in every stage: a separate database, migration history, credentials, domains and deployments from KeshevPlus; no real KeshevPlus records, secrets or connection strings anywhere in ESEKONE; live payments stay off until reconciliation and security gates pass.

---

## 5. Business model

**Decision needed.** The structure below is a proposal to validate, not a priced offer. No price is set here.

### 5.1 Revenue streams (proposed)
1. **Workspace subscription** by plan. Plans differ by included modules, seats and usage limits (entitlements and metering are EKO-012 and EKO-013).
2. **Add-on modules** purchased on top of a plan.
3. **AI usage**, metered against a budget per workspace so cost cannot run away.
4. **Services:** setup, data import, and custom modules, charged as projects.
5. **Merchant payments** (for workspaces that sell): a platform fee through Stripe Connect is possible. This needs a legal and tax review before it is offered.

### 5.2 Two separate money flows
ESEKONE's own **subscription billing** (what a workspace pays ESEKONE) is never mixed with **merchant payments** (what a workspace's customers pay that workspace). They have separate accounts, webhooks, reconciliation and refunds. Raw card data is never stored.

### 5.3 What must be true for this to work (to be tested, not assumed)
- Businesses will move from several tools to one.
- Setup is fast enough that a business reaches value without a services project.
- AI and automation costs stay below what a plan charges.
- Support load stays manageable as workspaces grow.

---

## 6. Go-to-market

1. **Prove it on the owner's own business.** KeshevPlus remains live and separate. ESEKONE is first used for a new, separate synthetic workspace, then for a real pilot only after stage 2 gates pass.
2. **Show, don't claim.** Public template previews (stage 0) with labelled sample data. A template is called "top converting" only after measured experiments support it.
3. **First external workspaces** through direct relationships in the first segments, with hands-on onboarding to learn what breaks.
4. **Then repeatable onboarding:** the first-run wizard (business identity, brand, template, locale, modules, first owner), resumable and shown only on an unconfigured workspace.

AI may draft demo pages, copy, FAQs and sample records so previews feel populated. Everything it creates is stored with a synthetic marker, visibly labelled, editable and removable in bulk. It never fabricates real customers, reviews, testimonials, payments or analytics.

---

## 7. The factory: how ESEKONE is built and shipped

ESEKONE is meant to be a factory: the same disciplined pipeline produces the platform and every release. This section summarizes the standing vision and the KeshevPlus epic that is building the pipeline.

### 7.1 Principles of the delivery vision
- Agents produce **finished, verified work**, not drafts or status claims.
- **One work inventory and one priority order** across GitHub and the admin panels: production, security and data-integrity incidents first, then release-blocking failures, then severe regressions, then ordinary bugs and features, then cosmetic work. Every priority has a reason.
- **Separate roles:** triage, todo management, coding, independent review, independent QA, bug management, and the merge and release gate.
- **The feedback loop:** triage → todo with acceptance criteria → code → independent review of the exact commit → QA → failures become linked bugs → fix → re-review and re-test → merge only when every gate passes on the current commit → verify on dev → promote to `main` through the release gates. No agent skips a gate, and a report is never proof.
- **Efficient testing:** narrowest test first; never repeat a review or test on an identical commit; the heavy end-to-end suite runs on a cadence, not on every push.
- **Statuses mean what they say:** Planned (not built), Implemented (code exists), Tested (checks ran and are recorded), Verified (observed in the intended environment by someone independent), Done (acceptance met and all verification passed).

### 7.2 The pipeline epic (KeshevPlus #292), in brief
Eleven steps: intake, prioritize, triage, plan QA, agent execution, CI and review, QA simulation, bug loop, reports, promotion gates and monitoring. As of 2026-11-21 (a reading of the issue, the code and the PR history, not a formal audit): the promotion gates and CI/review gate work; intake, prioritization, triage, agent execution and the bug loop are partly built; automatic test plans, QA simulation, the reports-and-audit page, and monitoring with event synchronization are not started.

### 7.3 Requirements for ESEKONE's factory
1. **Reusable, not clinic-specific.** The review and merge gate, GitHub-to-todo synchronization and the test-report generator must be configuration-driven (repository, environment names, domains), so they can serve ESEKONE and any workspace pipeline. KeshevPlus is the proving ground; generic code is built here.
2. **Standard tools for plumbing, custom code for what is yours.** Prefer GitHub rulesets and merge queue, Dependabot or Renovate, and infrastructure-as-code for provisioning. Write custom code only for the AI review policy, the tenant-isolation tests and report generation.
3. **AI is advisory; humans approve sensitive paths.** Authentication, schema, workflows, permissions and customer-data paths always need a human approval. AI-simulated QA is labelled as simulation and never counted as executed test evidence.
4. **Reports come from real runs.** Test plan, test design and test report documents are generated from actual CI and end-to-end results, with commit, environment, timestamps, results and limitations, so they are evidence, not simulation.
5. **Tenant isolation is a release gate.** Automated cross-tenant denial tests (reads, writes, exports, search and background jobs) run on every release and block it on failure.
6. **A second pipeline provisions workspaces.** Creating a workspace, its owner, configuration, enabled modules, site template, domain and (for stores) payment setup is a separate, tested, idempotent provisioning flow. It is a different track from shipping the platform.
7. **Budget the automation.** CI minutes and AI review costs are limited and tracked. Heavy suites run on a schedule or on promotion.
8. **Proven before extended.** The automatic repair loop is exercised on a safe change before more is built on it.

### 7.4 Release flow
Feature branch (no automatic preview deployment) → pull request to `dev` → CI and independent review → deployment to `dev` and live checks → promotion to `main` only when all gates pass, fast-forward only, with a recorded rollback target. Production changes require explicit owner authorization.

---

## 8. Roadmap

Phases are small vertical slices; each needs code, tests, docs, a recorded status and a verified deployment before it is called done. Backlog IDs refer to [TODO.md](../TODO.md).

| Phase | Focus | Exit criteria |
|---|---|---|
| **0. Foundation** (now) | Independent architecture, Neon database with separate migration and runtime roles, forced row-level security, CI gates (EKO-001 to EKO-004) | Dedicated Neon project provisioned; migrations applied and cross-tenant denial tests passing against it, not only in CI |
| **1. Workspaces and access** | Onboarding wizard, organizations, invitations, MFA, sessions, roles (EKO-010, EKO-011), audit events (EKO-014) | A new owner provisions a workspace from nothing; viewer and unknown roles are denied writes by test |
| **2. Core business modules** | CRM extensions, tasks and projects, calendar, forms, communications (EKO-020 to EKO-025) | A service business runs a week of synthetic operations end to end |
| **3. Sites and templates** | Template catalog with manifests and design tokens, content module, static previews (EKO-040 to EKO-042) | Three visibly distinct templates pass 320, 360/375, 768, 1024 and desktop checks in RTL and LTR |
| **4. Billing and commerce** | Plans, entitlements, metering (EKO-012, EKO-013); commerce and Stripe Connect in test mode (EKO-024) | Webhooks verified and idempotent; reconciliation and refunds tested; live payments still off |
| **5. Automation and AI workforce** | Automation engine (EKO-026), agent runtime, tool registry, approval gates (EKO-030 to EKO-034) | Sensitive tool calls blocked without approval, proven by test |
| **6. Factory automation** | GitHub-to-todo sync, report generation, monitoring, workspace provisioning pipeline (section 7.3) | Dashboard matches GitHub within a stated interval; a reproducible provisioning run |
| **7. Launch hardening** | Threat model, scanning, rate limits and monitoring, backup restoration, penetration tests, load and recovery tests (EKO-050 to EKO-055); support process | Stage 2 gates in section 4 met; first real workspaces admitted |
| **8. KeshevPlus onto ESEKONE (optional, last)** | Migrate the clinic only after an independently verified plan | Owner decision; never a reset or repoint of the live database |

Dates are not set. They should be added once phase 0 completes and delivery speed has been measured.

---

## 9. Risks and mitigations

| Risk | Mitigation |
|---|---|
| **Tenant data leak** | Server-derived tenant scope, row-level security, automated cross-tenant tests as a release gate, independent penetration test before launch |
| **Over-building the factory before there are customers** | Prove on the owner's own business first; add autonomy only after the previous step is proven |
| **Fragile automation** (past reviews and auto-merge have both misfired on the KeshevPlus pipeline) | AI advisory, human approval on sensitive paths, narrow fixture-tested rules, exact-commit gates |
| **Scope: every KeshevPlus capability, plus a platform** | Parity table in section 3.3; slice by module; close gaps in the backlog deliberately |
| **Healthcare privacy obligations** | Clinics pack isolated as a module with its own gates; synthetic data only until stage 2; legal review before storing real client records |
| **Payments and tax** | Stripe Connect in test mode first; legal and tax review before any platform fee; live payments off until gates pass |
| **Cost growth** (CI minutes, AI, hosting) | Budgets and metering per workspace; heavy suites on schedule |
| **Static hosting misunderstood as a working product** | Stage 0 shows only labelled synthetic previews; the back office needs the stage 1 runtime |
| **One person is the bottleneck** | Small slices, documented decisions, automation of repetitive gates, clear lanes for concurrent work |

---

## 10. How progress is measured

Targets are **to be set** once a baseline exists; none are invented here.

- **Delivery:** lead time from request to verified on `dev`; share of changes passing all gates first time; escaped defects found after promotion.
- **Safety:** cross-tenant tests passing on every release; time to restore from backup in a test; open critical security findings.
- **Product:** time for a new workspace to reach its first useful action; modules enabled per workspace; setup completed without help.
- **Business:** workspaces by segment; retention; revenue per workspace; AI cost per workspace against its plan; support requests per workspace.
- **Honesty:** share of statuses backed by recorded evidence.

---

## 11. Decisions needed from the owner

1. **Hosting for stage 0:** which "pages" service is meant (GitHub Pages, Firebase Hosting, Google Sites, other)? Note that none of them can run the backend.
2. **Domain:** the proper domain name(s) for stage 2 and whether workspaces get subdomains, custom domains or both.
3. **Plans and prices:** the plan structure, what each includes, and the pricing approach.
4. **First external segment:** confirm clinics and service businesses, or choose another.
5. **Healthcare:** whether the Clinics pack will be sold to other practices, and which privacy and legal review is required first.
6. **Payments:** whether ESEKONE will take a platform fee on merchant payments, and under which legal entity.
7. **Languages:** which locales ship first beyond Hebrew and English.
8. **Support model:** who answers customers, at what hours, with what promised response.
9. **Factory scope:** which parts of the KeshevPlus epic #292 are built generically in ESEKONE first (suggested: the review and merge gate, GitHub-to-todo sync, report generation).
10. **Promotion:** `main` is 26 commits behind `dev` as of this draft. Decide when `dev` is promoted, using the gates in [RELEASE_GATES.md](RELEASE_GATES.md) and a pull request, not a direct push.

---

## 12. Source documents
- [README](../README.md): product principles, repository map and core domains
- [Architecture](ARCHITECTURE.md): trust boundaries, modules, isolation, AI safety, security baseline, release
- [Release gates](RELEASE_GATES.md): when a change may merge to `dev` and be promoted to `main`; deployment cost controls
- [Neon setup](NEON_SETUP.md): database branches, roles and connection layout
- [Delivery backlog](../TODO.md): current task statuses referenced above
- [Security policy](../SECURITY.md)
- KeshevPlus repository: `docs/ESEKONE_PLATFORM_PLAN.md` (migration plan and architecture decisions), `VISION.md` (delivery vision) and epic #292 (pipeline automation)
