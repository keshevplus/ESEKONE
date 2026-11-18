const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class WorkspaceAccessDeniedError extends Error {
  readonly code = "workspace_access_denied";

  constructor() {
    super("Workspace access denied");
    this.name = "WorkspaceAccessDeniedError";
  }
}

export type ActiveMembershipLookup = (
  workspaceId: string,
  userId: string,
) => Promise<boolean>;

/**
 * Fail closed unless both identifiers are valid and the caller has an active
 * membership in the requested workspace. The lookup must be performed inside
 * the same database transaction that will establish tenant context.
 */
export async function requireWorkspaceMembership(
  workspaceId: string,
  userId: string,
  findActiveMembership: ActiveMembershipLookup,
): Promise<void> {
  if (!UUID_PATTERN.test(workspaceId) || !UUID_PATTERN.test(userId)) {
    throw new WorkspaceAccessDeniedError();
  }

  const isActiveMember = await findActiveMembership(workspaceId, userId);
  if (!isActiveMember) {
    throw new WorkspaceAccessDeniedError();
  }
}
