# CLAUDE.md

@AGENTS.md

## Owner working rules

- Treat every owner request to change repository code as an open TODO. Continue until implemented, tested, reviewed, merged and deployed when authorized. Do not stop at suggestions or a PR if you can safely continue.
- Make sound engineering decisions; do not offer a menu of options. Ask only when a missing permission, secret, external connection or genuinely ambiguous product decision blocks the work.
- Work in small related commits on a feature branch. Check current dev/branches before editing and incorporate active work rather than overwriting it.
- Be DRY, typed and cohesive. Avoid spaghetti, duplicated logic, giant components/routes, unnecessary abstractions and unrelated package upgrades.
- Keep ESEKONE industry-neutral and tenant-safe. Never use another product's database, environment values, backups, uploads or customer data.
- Run focused checks first, then typecheck, tests, build, review and live verification. Never claim a check or deployment passed without evidence.
- Keep AGENTS.md, docs and TODO.md current in the same change.
- No feature-branch Vercel previews by default. Only deploy dev and main; automatically promote only the exact dev SHA that passed CI, review, live smoke and deployment readiness.
- Never force-push, bypass a failed gate, or mark a TODO done based on an agent's narrative alone.
