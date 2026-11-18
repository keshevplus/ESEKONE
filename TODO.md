# ESEKONE Delivery Backlog

Statuses: `backlog`, `ready`, `in_progress`, `blocked`, `review`, `testing`, `done`.
A task is only `done` when implementation evidence and passing relevant tests are recorded. Failed checks return it to `in_progress` or `blocked`.

## Foundation
- [x] **EKO-001 — Establish independent platform architecture** — `done` — Modular-monolith boundaries, API runtime, three-repository responsibilities and release flow documented.
- [ ] **EKO-002 — Provision and verify the independent ESEKONE database** — `in_progress` — Initial PostgreSQL schema and ordered SQL migrations are committed; provision a dedicated managed database and run migrations before integration.
- [ ] **EKO-003 — Complete and verify tenant isolation** — `in_progress` — Tenant access helper now fails closed unless a valid user ID and workspace ID have an active membership. Four unit cases cover allow, deny, malformed IDs and database errors. Database-backed cross-tenant read/write integration tests remain outstanding.
- [ ] **EKO-004 — Complete CI quality gates** — `in_progress` — CI runs typecheck, unit tests and production build; lint, database integration and security scans remain outstanding.

## SaaS platform
- [ ] **EKO-010 — Organization and workspace provisioning** — `backlog`
- [ ] **EKO-011 — Identity, MFA, sessions and RBAC** — `backlog`
- [ ] **EKO-012 — Plans, subscriptions, billing and entitlements** — `backlog`
- [ ] **EKO-013 — Usage metering and plan limits** — `backlog`
- [ ] **EKO-014 — Audit events and administrator activity history** — `backlog`

## Business OS modules
- [ ] **EKO-020 — Configurable CRM and customer records** — `in_progress` — First workspace-scoped contacts API and validation tests are implemented; expand to custom fields, timeline, duplicate detection and imports.
- [ ] **EKO-021 — Sales pipeline and revenue operations** — `backlog`
- [ ] **EKO-022 — Universal tasks, projects and team workload** — `backlog`
- [ ] **EKO-023 — Calendar, appointments and resource scheduling** — `backlog`
- [ ] **EKO-024 — Products, orders and inventory** — `backlog`
- [ ] **EKO-025 — Documents, communications and integrations** — `backlog`
- [ ] **EKO-026 — Workflow automation engine** — `backlog`
- [ ] **EKO-027 — Reporting and business intelligence** — `backlog`

## AI workforce
- [ ] **EKO-030 — Agent runtime, tool registry and policy enforcement** — `backlog`
- [ ] **EKO-031 — CRM, Task, Growth, Operations and Support agents** — `backlog`
- [ ] **EKO-032 — Admin AI orchestrator and handoff protocol** — `backlog`
- [ ] **EKO-033 — Evidence-based TODO status synchronization** — `backlog`
- [ ] **EKO-034 — Approval gates for sensitive actions** — `backlog`

## Experience and launch
- [ ] **EKO-040 — ESEKONE design system and responsive workspace** — `backlog` — Workspace frontend is intentionally deferred until the core API and authorization model are proven.
- [ ] **EKO-041 — Translation framework and RTL/LTR support** — `backlog`
- [ ] **EKO-042 — Public marketing site and conversion flows** — `backlog` — Marketing frontend is intentionally deferred until the core API is proven.
- [ ] **EKO-043 — Onboarding, help and product tours** — `backlog`

## Security and reliability
- [ ] **EKO-050 — Threat model and security baseline** — `in_progress` — Initial baseline is documented; authorization ordering and tenant-isolation assurance are being tightened.
- [ ] **EKO-051 — Secret, dependency and static security scanning** — `backlog`
- [ ] **EKO-052 — Rate limiting, abuse controls and monitoring** — `backlog`
- [ ] **EKO-053 — Backup and restore verification** — `backlog`
- [ ] **EKO-054 — Tenant-isolation and authorization penetration tests** — `backlog`
- [ ] **EKO-055 — Load, accessibility and recovery testing** — `backlog`

## Release discipline
1. Build on feature branches inside the ESEKONE core repository.
2. Merge validated work into `dev`; validate the core service.
3. Promote only the proven core release to `main`.
4. Verify `dev` and `main` resolve to the same release.
5. Do not change the separate workspace/marketing repositories or external business infrastructure until the ESEKONE core is proven.

## Agent task contract
Every automated task must record: owner/agent, objective, acceptance criteria, status, changed files, test commands/results, evidence, risks and next action. Agents may not mark tasks complete based only on their own narrative. Destructive, financial, access-control and production actions require explicit human approval.
