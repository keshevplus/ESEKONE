# ESEKONE Delivery Backlog

Statuses: `backlog`, `ready`, `in_progress`, `blocked`, `review`, `testing`, `done`.
A task is only `done` when implementation evidence and passing relevant tests are recorded. Failed checks return it to `in_progress` or `blocked`.

## Foundation
- [x] **EKO-001 — Establish independent platform architecture** — `done` — Modular-monolith boundaries, API runtime, three-repository responsibilities and release flow documented.
- [ ] **EKO-002 — Provision and verify the independent ESEKONE database** — `in_progress` — Neon selected. Neon-specific setup guide and role model are documented; actual Neon project/branches, protected credentials, migrations and live connection validation remain.
- [ ] **EKO-003 — Complete and verify tenant isolation** — `in_progress` — OIDC verification, membership checks, forced PostgreSQL RLS and cross-tenant read/write denial tests are implemented in CI; validate the same controls against the provisioned Neon production database.
- [ ] **EKO-004 — Complete CI quality gates** — `in_progress` — Typecheck, production build, unit tests, PostgreSQL migrations and cross-tenant RLS integration tests run in CI; live Neon validation and broader security checks remain.

## SaaS platform
- [ ] **EKO-010 — Organization and workspace provisioning** — `in_progress` — Verified-identity onboarding creates an organization, first workspace and owner membership; invitation and multi-workspace administration remain.
- [ ] **EKO-011 — Identity, MFA, sessions and RBAC** — `in_progress` — OIDC identities require verified email claims; workspace mutations are denied to viewer/unknown roles. Invitations, MFA policy and session lifecycle remain.
- [ ] **EKO-012 — Plans, subscriptions, billing and entitlements** — `backlog`
- [ ] **EKO-013 — Usage metering and plan limits** — `backlog`
- [ ] **EKO-014 — Audit events and administrator activity history** — `in_progress` — Audit-event storage exists; administrator-facing search, retention controls and activity UI remain.

## Business OS modules
- [ ] **EKO-020 — Configurable CRM and customer records** — `in_progress` — Workspace-scoped contacts API, validation tests and live Customers UI (search, filters, create and status changes) are in `dev`; custom fields, timeline, imports and bulk operations remain.
- [ ] **EKO-021 — Sales pipeline and revenue operations** — `backlog`
- [ ] **EKO-022 — Universal tasks, projects and team workload** — `in_progress` — Project and task directories, creation, project linking, allowed lifecycle transitions, event history, agent-request prompts and visible queue states are in web `dev`; workload/assignment views and provider-backed worker execution remain.
- [ ] **EKO-023 — Calendar, appointments and resource scheduling** — `in_progress` — Month view and selected-day agenda for task due dates are in web `dev`; appointments, recurring events, resource availability and external calendar sync remain.
- [ ] **EKO-024 — Products, orders and inventory** — `backlog`
- [ ] **EKO-025 — Documents, communications and integrations** — `backlog`
- [ ] **EKO-026 — Workflow automation engine** — `backlog`
- [ ] **EKO-027 — Reporting and business intelligence** — `backlog`

## AI workforce
- [ ] **EKO-030 — Agent runtime, tool registry and policy enforcement** — `in_progress` — A standalone OpenAI Responses review worker, strict output schema, failure reporting, bounded retries and stale-lease recovery are implemented on this feature branch; provider credentials, persistent worker deployment, scoped business tools, approvals and true autonomous actions remain.
- [ ] **EKO-031 — CRM, Task, Growth, Operations and Support agents** — `in_progress` — Specialist review guidance for admin, CRM, projects, operations, growth and support is wired into the review worker; tool-enabled execution and domain-specific agents remain.
- [ ] **EKO-032 — Admin AI orchestrator and handoff protocol** — `backlog`
- [ ] **EKO-033 — Evidence-based TODO status synchronization** — `backlog`
- [ ] **EKO-034 — Approval gates for sensitive actions** — `backlog`

## Experience and launch
- [ ] **EKO-040 — ESEKONE design system and responsive workspace** — `in_progress` — Responsive dashboard, Customers, Projects, Tasks and task-deadline Calendar screens are in web `dev`; consolidate shared design tokens/components and complete accessibility/mobile QA.
- [ ] **EKO-041 — Translation framework and RTL/LTR support** — `in_progress` — English/Hebrew copy and RTL/LTR layouts now cover the dashboard and new workspace modules; centralized translation keys, user locale persistence and completeness QA remain.
- [ ] **EKO-042 — Public marketing site and conversion flows** — `in_progress`
- [ ] **EKO-043 — Onboarding, help and product tours** — `backlog`

## Security and reliability
- [ ] **EKO-050 — Threat model and security baseline** — `ready`
- [ ] **EKO-051 — Secret, dependency and static security scanning** — `in_progress` — Manual workflow for npm audit, CodeQL security-extended, typecheck, tests and build is on core `dev`; secret scanning, automated dependency update policy and a workflow run from default branch remain.
- [ ] **EKO-052 — Rate limiting, abuse controls and monitoring** — `backlog`
- [ ] **EKO-053 — Backup and restore verification** — `backlog`
- [ ] **EKO-054 — Tenant-isolation and authorization penetration tests** — `backlog`
- [ ] **EKO-055 — Load, accessibility and recovery testing** — `backlog`

## Proposed from the business plan (pending owner review)
These close gaps found by comparing the KeshevPlus admin and backend with this backlog (business plan, section 3.3) and add the factory work in [docs/DELIVERY_FACTORY.md](docs/DELIVERY_FACTORY.md). They are proposals: not scheduled, not committed to.
- [ ] **EKO-060 — Module manifest, install, enable/disable and safe removal** — `backlog` — The contract every module builds on: routes, navigation, permission keys, setup steps, migrations, events, AI tools and tests; entitlement-controlled enablement; removal that leaves no orphaned navigation or failing jobs.
- [ ] **EKO-061 — Forms and intake module** — `backlog` — Public forms, spam control, routing into the CRM.
- [ ] **EKO-062 — Content and site module** — `backlog` — Pages, reusable blocks, blog, media, publishing; depends on EKO-042.
- [ ] **EKO-063 — Campaigns, chat widget and WhatsApp** — `backlog` — Extends EKO-025 with email campaigns and chat channels.
- [ ] **EKO-064 — Marketing and ads reporting** — `backlog` — Campaign and spend reporting and source attribution; extends EKO-027.
- [ ] **EKO-065 — Clinics pack** — `backlog` — Client records, intake and privacy controls for practices. Blocked on a legal and privacy review; synthetic data only until then.
- [ ] **EKO-066 — Operations and QA module** — `backlog` — Todos, bugs, QA reports and release notes with created and updated date and time on every record; extends EKO-033.
- [ ] **EKO-067 — Static preview hosting (stage 0)** — `backlog` — Public site and template previews with clearly labelled synthetic content; no backend, no real data.
- [ ] **EKO-068 — Delivery factory: GitHub reconciliation, reusable merge gate, report generation** — `backlog` — Generic versions of the pipeline pieces proven in KeshevPlus; see the build order in the factory document.
- [ ] **EKO-069 — Workspace provisioning pipeline** — `backlog` — Idempotent, tested creation of a workspace, owner, configuration, modules, template, domain and payment setup.

## Release discipline
1. Build on feature branches.
2. Merge validated work into `dev`; deploy `dev` for integration testing.
3. Promote the tested release to `main`.
4. Verify `dev` and `main` resolve to the same release.
5. Back-merge emergency main fixes.
6. Avoid preview deployments for every feature commit.

## Agent task contract
Every automated task must record: owner/agent, objective, acceptance criteria, status, changed files, test commands/results, evidence, risks and next action. Agents may not mark tasks complete based only on their own narrative. Destructive, financial, access-control and production actions require explicit human approval.
