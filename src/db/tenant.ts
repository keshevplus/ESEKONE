import { and, eq, sql } from "drizzle-orm";
import { db } from "./client.js";
import { memberships, users } from "./schema.js";
import {
  requireWorkspaceMembership,
  WorkspaceAccessDeniedError,
} from "./workspace-access.js";

export { WorkspaceAccessDeniedError };

/**
 * Establish transaction-local tenant context only after proving that the
 * active user belongs to the requested workspace. Keep the membership check
 * and all tenant-scoped work in the same transaction.
 */
export async function withWorkspaceContext<T>(
  workspaceId: string,
  userId: string,
  run: (tx: any) => Promise<T>,
): Promise<T> {
  if (!db) throw new Error("DATABASE_URL is not configured");

  return db.transaction(async (tx) => {
    // Membership RLS is evaluated against this user context. Do not set the
    // workspace context until the membership query has succeeded.
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

/** Use only after the identity has been resolved to an active local user. */
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
