import type { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { memberships, users } from "../db/schema.js";
import {
  withIdentityContext,
  withWorkspaceContext,
  WorkspaceAccessDeniedError,
} from "../db/tenant.js";
import { authenticateAuthorizationHeader, oidcConfigured } from "../auth/oidc.js";

export function canWriteRole(role: string) {
  return ["owner", "admin", "manager", "member"].includes(role);
}

export async function withAuthorizedWorkspace(
  req: Request,
  res: Response,
  action: (tx: any, userId: string, workspaceId: string) => Promise<unknown>,
  write = false,
) {
  if (!oidcConfigured) return res.status(503).json({ error: "identity_provider_not_configured" });
  if (!db) return res.status(503).json({ error: "database_not_configured" });

  let identity;
  try {
    identity = await authenticateAuthorizationHeader(req.headers.authorization);
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
  if (!identity) return res.status(401).json({ error: "verified_identity_required" });

  const workspaceId = zUuid(req.params.workspaceId);
  if (!workspaceId) return res.status(400).json({ error: "invalid_workspace_id" });

  try {
    const [user] = await withIdentityContext(identity.subject, (tx) =>
      tx.select().from(users)
        .where(and(eq(users.identitySubject, identity.subject), eq(users.active, true)))
        .limit(1),
    );
    if (!user) return res.status(403).json({ error: "account_not_provisioned" });

    const result = await withWorkspaceContext(workspaceId, user.id, async (tx) => {
      // Membership has already been proven in this transaction. Read its role
      // here so the authorization decision and requested action share the same
      // transaction and workspace context.
      const [membership] = await tx
        .select({ role: memberships.role })
        .from(memberships)
        .where(and(
          eq(memberships.workspaceId, workspaceId),
          eq(memberships.userId, user.id),
          eq(memberships.status, "active"),
        ))
        .limit(1);

      if (!membership) throw new WorkspaceAccessDeniedError();
      if (write && !canWriteRole(membership.role)) return { forbidden: true };
      return action(tx, user.id, workspaceId);
    });

    if (result && typeof result === "object" && "forbidden" in result) {
      return res.status(403).json({ error: "insufficient_workspace_role" });
    }
    if (result && typeof result === "object" && "notFound" in result) return res.status(404).json(result);
    if (result && typeof result === "object" && "conflict" in result) return res.status(409).json(result);
    return res.json(result);
  } catch (error) {
    if (error instanceof WorkspaceAccessDeniedError) {
      return res.status(403).json({ error: error.code });
    }
    const requestId = res.locals.requestId;
    console.error("Workspace request failed", requestId, error instanceof Error ? error.message : "unknown");
    return res.status(500).json({ error: "request_failed", requestId });
  }
}

function zUuid(value: unknown): string | null {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  ) return null;
  return value;
}
