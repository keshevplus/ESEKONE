# Delivery factory

**Status:** Draft v0.1 · 2026-11-21 · part of the [business plan](ESEKONE_BUSINESS_PLAN.md) (section 7)

How ESEKONE is built, reviewed, tested and shipped, and how that pipeline is meant to become reusable infrastructure. It is based on the delivery vision and on the pipeline epic currently being built in the KeshevPlus repository (epic #292). The KeshevPlus pipeline is the **proving ground**; ESEKONE builds the generic version.

> Statuses below are a reading of the KeshevPlus issue, code and pull-request history on 2026-11-21. They are not a formal audit and nothing was run end to end for this document.

## 1. Delivery vision

- Agents produce **finished, verified work**, not drafts or status claims.
- **One inventory, one priority order.** GitHub Issues and pull requests and the admin work panels stay reconciled, with no duplicates and history preserved. Priority order: production, security and data-integrity incidents; then release-blocking CI, infrastructure, authentication and deployment failures; then severe regressions; then blockers and dependencies; then ordinary bugs and features; then cosmetic work. Every priority has a stated reason.
- **Separate roles:** triage, todo management, coding, independent review, independent QA, bug management, and the merge and release gate.
- **Feedback loop:** triage → todo with acceptance criteria → code and checks → independent review of the exact commit → independent QA → failures become linked bugs and return to development → fixes are re-reviewed and re-tested → merge only when every gate passes on the current commit, non-draft, correctly targeted and conflict-free → verify on `dev` → promote to `main` through the release gates.
- **No gate is skipped and no report is proof.** A review is stale once the reviewed commit changes.
- **Efficient testing:** narrowest meaningful test first; never repeat a review or test on an identical commit and environment; run the heavy end-to-end suite on a cadence, not on every push.
- **Statuses mean what they say:** Planned (not built), Implemented (code exists), Tested (checks ran, results recorded), Verified (independently observed in the intended environment), Done (acceptance met and all verification passed).

## 2. The lifecycle (eleven steps)

1. **Intake:** every request becomes a tracked item with scope and acceptance criteria, de-duplicated.
2. **Prioritize:** newest verified activity and current active work first; blockers, dependencies and next action visible.
3. **Triage:** AI classifies, checks duplicates and files bugs; confirmed defects are separate from suspected findings.
4. **Plan QA:** a test plan and test design for each feature or grouped run.
5. **Agent execution:** bounded tasks on isolated branches; agents never self-merge or deploy production.
6. **CI and review:** automated checks and independent review of the exact commit.
7. **QA simulation:** functional, exploratory, regression, accessibility, privacy and edge-case perspectives, clearly labelled as simulation.
8. **Bug loop:** failures create or link bugs without duplicates; fixes are re-tested.
9. **Reports:** versioned test plan, test design and test report, plus an append-only audit trail with commit, environment, timestamps, results, evidence and limitations.
10. **Promotion gates:** `dev` first; green checks, review and approval before merge; production needs explicit owner authorization.
11. **Monitoring:** status refreshed by webhooks and scheduled reconciliation, with stale or broken sync shown, not hidden.

Synthetic data only in tests; no real customer or patient data; no production change without explicit authorization.

## 3. Where the KeshevPlus pipeline stands (2026-11-21)

| Step | Status | Note |
|---|---|---|
| 6 CI and review | Working | The merge gate works; the independent reviewer's calibration is still being tuned. |
| 10 Promotion gates | Working | Promotion from `dev` to `main` runs end to end with a live smoke test; auto-merge checks CI on the exact commit. |
| 1 Intake | Partial | Items are logged through an API by hand; no automatic GitHub link yet. |
| 2 Prioritize | Partial | Live counts and latest activity exist; no GitHub linkage or "last synced" indicator. |
| 3 Triage | Partial | Rule-based review triage and an AI triage action exist; duplicate detection is incomplete. |
| 5 Agent execution | Partial | An automatic repair loop has just merged but is not yet proven end to end. |
| 8 Bug loop | Partial | Bugs, retest and manual status work; filing bugs from CI failures depends on a setting. |
| 4 Plan QA | Not started | |
| 7 QA simulation | Not started | |
| 9 Reports and audit | Not started | |
| 11 Monitoring and event sync | Not started | This is the main reason the dashboard drifts from GitHub. |

### Lessons from running it
These are the failure patterns seen so far, so ESEKONE does not repeat them:
- Auto-merge once merged a pull request whose CI was failing; merge gates must check every required check on the exact head commit.
- An automated reviewer stopped blocking a missing-authorization defect after a change to its instructions, and flagged pinned commit hashes (the safer choice) as a risk. AI review needs fixture-based calibration and a human on sensitive paths.
- A review tool capped its chunk count and failed on a large lockfile; tools need limits that degrade gracefully and are tested on large inputs.
- CI minutes ran out and every job failed at start-up; automation needs budgets and visible cost.
- An "independent" reviewer that posts under the author's credential can only comment, so its independence is limited and must be stated.

## 4. What is generic and what is not

| Component | For ESEKONE | Why |
|---|---|---|
| Review and merge gate, auto-merge conditions | **Generic.** Build configurably: repository, branches, required checks, environment URLs. | Every pipeline needs it. |
| GitHub-to-todo synchronization and reconciliation | **Generic.** | Same need for any workspace. |
| Todo, bug and QA tooling | **Generic module** ("Operations and QA"), also used internally by the ESEKONE team. | Sold as a module and used for our own delivery. |
| Test plan, design and report generator | **Generic.** Generate from real CI and end-to-end results. | Evidence, not authored documents. |
| Agent repair loop | **Generic, with guardrails**: bounded rounds, spend cap, never merges, never edits workflows or weakens tests. | Needs proof before reuse. |
| Workspace provisioning pipeline | **New, ESEKONE-only track.** Idempotent: workspace, owner, configuration, modules, template, domain, payment setup. | Not part of the KeshevPlus epic. |
| Clinic form end-to-end specs and clinic smoke tests | KeshevPlus-only (a clinic pack may later have its own). | Clinic-specific behavior. |
| Patient-records handling and development-database anonymization | KeshevPlus-only. ESEKONE never copies production customer data to `dev`; development uses synthetic data. | Different data policy. |
| Admin search-exclusion headers, domain-alias sync workflows | KeshevPlus-only. | Specific to its domains and hosting. |

## 5. Proposed build order for ESEKONE

Small slices, each with tests, docs and a verified result (see section 8 of the business plan). Proposed, not scheduled:

1. **Module manifest and enable/disable** (the contract every module, including these tools, builds on).
2. **Operations and QA module:** items with created and updated timestamps, linked to GitHub issues and pull requests by stable ids.
3. **GitHub reconciliation** (scheduled and event-driven, de-duplicating, with a visible "last synced"), the foundation for steps 1, 2 and 11.
4. **Merge and review gate** as a reusable, configurable workflow, proven on a safe change before more is built on it.
5. **Report generation** from real test runs (steps 4, 7 and 9).
6. **Workspace provisioning pipeline.**
7. **Monitoring and synthetic end-to-end checks** across all of the above.

## 6. Requirements that always apply

- Tenant isolation tests (reads, writes, exports, search, background jobs) run on every release and block it on failure.
- AI is advisory; humans approve sensitive paths (authentication, permissions, schema, workflows, customer data). AI-simulated QA is labelled and never counted as executed evidence.
- Prefer standard platform features (branch rulesets, merge queue, dependency-update bots, infrastructure as code) for plumbing; write custom code only for what is distinct: review policy, isolation tests and report generation.
- Budget CI minutes and AI cost; run heavy suites on a schedule or at promotion.
- Missing data is shown as unknown, stale or blocked, never filled in.
