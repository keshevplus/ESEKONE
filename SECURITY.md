# Security Policy

ESEKONE treats security as a continuous product and operational requirement.

## Reporting
Do not disclose suspected vulnerabilities publicly. Report them privately to the project maintainers with reproduction steps, impact and relevant logs (redact secrets and personal data).

## Security expectations
- Enforce authentication and tenant-scoped authorization on the server.
- Require MFA for privileged roles and protect sessions with secure cookie settings.
- Validate all inputs and encode outputs; use parameterized database access.
- Apply least privilege to humans, integrations, jobs and AI agents.
- Protect secrets with managed storage and rotation; never commit credentials.
- Apply rate limits and abuse controls to public and authenticated endpoints.
- Maintain dependency, secret and static security scans.
- Keep auditable records of privileged and sensitive actions.
- Maintain encrypted backups and regularly test restoration.
- Perform threat modeling and independent security testing before production launch.

No software can be guaranteed completely immune to compromise. Reported issues must be triaged, fixed, tested and tracked to verified closure.
