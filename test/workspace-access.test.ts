import assert from "node:assert/strict";
import test from "node:test";
import {
  requireWorkspaceMembership,
  WorkspaceAccessDeniedError,
} from "../src/db/workspace-access.js";

const workspaceId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";

test("allows an active workspace membership", async () => {
  let lookupArgs: string[] = [];
  await requireWorkspaceMembership(workspaceId, userId, async (workspace, user) => {
    lookupArgs = [workspace, user];
    return true;
  });
  assert.deepEqual(lookupArgs, [workspaceId, userId]);
});

test("denies a user without active membership", async () => {
  await assert.rejects(
    () => requireWorkspaceMembership(workspaceId, userId, async () => false),
    (error: unknown) => error instanceof WorkspaceAccessDeniedError && error.code === "workspace_access_denied",
  );
});

test("rejects malformed workspace or user IDs before database lookup", async () => {
  let lookups = 0;
  await assert.rejects(
    () => requireWorkspaceMembership("not-a-workspace", userId, async () => {
      lookups += 1;
      return true;
    }),
    WorkspaceAccessDeniedError,
  );
  await assert.rejects(
    () => requireWorkspaceMembership(workspaceId, "not-a-user", async () => {
      lookups += 1;
      return true;
    }),
    WorkspaceAccessDeniedError,
  );
  assert.equal(lookups, 0);
});

test("does not conceal membership database errors", async () => {
  const databaseError = new Error("database unavailable");
  await assert.rejects(
    () => requireWorkspaceMembership(workspaceId, userId, async () => {
      throw databaseError;
    }),
    databaseError,
  );
});
