import { and, eq, sql } from "drizzle-orm";
import { db } from "./client.js";
import { memberships, users } from "./schema.js";
import { requireWorkspaceMembership } from "./workspace-access.js";

export { WorkspaceAccessDeniedError } from "./workspace-access.js";

/**
 * Confirm an active membership and establish tenant context in the same
 * transaction. The workspace setting is not installed until membership passes.
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

/** Resolve only the local user row matching a previously verified OIDC subject. */
export async function withIdentityContext<T>(
  identitySubject: string,
  run: (tx: any) => Promise<T>,
): Promise<T> {
  if (!db) throw new Error("DATABASE_URL is not configured");
  if (!identitySubject.trim()) throw new Error("Identity subject is required");

  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.identity_subject', ${identitySubject}, true)`);
    return run(tx);
  });
}

/** Establish a user-only context to list the caller's memberships. */
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

/** Temporary capability used only by the authenticated workspace bootstrap handler. */
export async function withBootstrapContext<T>(
  userId: string,
  run: (tx: any) => Promise<T>,
): Promise<T> {
  if (!db) throw new Error("DATABASE_URL is not configured");

  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.user_id', ${userId}, true)`);
    await tx.execute(sql`select set_config('app.bootstrap', 'true', true)`);
    return run(tx);
  });
}

/** Global task-queue access is available only to separately authenticated worker routes. */
export async function withAgentWorkerContext<T>(run: (tx: any) => Promise<T>): Promise<T> {
  if (!db) throw new Error("DATABASE_URL is not configured");

  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.agent_worker', 'true', true)`);
    return run(tx);
  });
}
