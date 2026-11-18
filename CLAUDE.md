# CLAUDE.md

@AGENTS.md

## Working rules

- Treat every owner request to change code as an open TODO. Keep working until implemented, tested, reviewed, merged and deployed when authorized. Do not stop at suggestions or a PR if you can continue.
- Make sensible engineering decisions without asking for options. Ask only for a genuinely unavailable permission, secret, external connection, or ambiguous product decision that changes the implementation.
- Work in small related commits on a feature branch. Build on existing code; inspect the relevant modules and open branches first.
- Be DRY and typed. Avoid spaghetti, duplicate abstractions, giant files and framework churn.
- Keep the product generic and multi-tenant. Do not introduce industry-specific assumptions into shared code.
- Preserve synthetic/live data provenance and tenant boundaries across every agent/tool.
- Run the narrowest relevant tests first; then typecheck, lint, unit/integration tests and build. Never claim a check passed unless its output proves it.
- Never copy a database, credentials, backups or customer data from another product into ESEKONE.
- Keep TODO.md and docs updated in the same change.
- Feature branches should not trigger previews. The Vercel ignore-build guard allows only dev and main; promote only a tested, deployed dev SHA.
- Do not force-push or deploy to production manually. Use the automated release workflow and verify the live result.
