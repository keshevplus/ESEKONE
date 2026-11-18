import { and, eq, sql } from "drizzle-orm";
import { db } from "./client.js";
import { memberships, users } from "./schema.js";
import { requireWorkspaceMembership } from "./workspace-access.js";

export { WorkspaceAccessDeniedError } from "./workspace-access.js";

/**
 * Membership is checked inside the same transaction before workspace context
 * is installed. RLS then scopes all subsequent queries on this transaction.
 */
export async function withWorkspaceContext<T>(
  workspaceId: string,
  userId: string,
  run: (tx: any) => Promise<T>,
): Promise<T> {
  if (!db) throw new Error("DATABASE_URL is not configured");

  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.user_id', ${userId}, true)`);

    await requireWorkspaceMembership(workspaceId, userId, async (requestedWorkspaceId, requestedUserId) => {
      const [membership] = await tx
        .select({ id: memberships.id })
        .from(memberships)
        .innerJoin(users, eq(memberships.userId, users.id))
        .where(and(
          eq(memberships.workspaceId, requestedWorkspaceId),
          eq(memberships.userId, requestedUserId),
          eq(memberships.status, "active"),
          eq(users.active, true),
        ))
        .limit(1);

      return Boolean(membership);
    });

    await tx.execute(sql`select set_config('app.workspace_id', ${workspaceId}, true)`);
    return run(tx);
  });
}

/** Establish a user-only context for listing the caller's own memberships. */
export async function withUserContext<T>(
  userId: string,
  run: (tx: any) => Promise<T>,
): Promise<T> {
  if (!db) throw new Error("DATABASE_URL is not configured");

  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.user_id', ${userId}, true)`);
    return run(tx);
  });
}
