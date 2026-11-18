import assert from "node:assert/strict";
import test from "node:test";
import {
  requireWorkspaceMembership,
  WorkspaceAccessDeniedError,
} from "../src/db/workspace-access.js";

const workspaceId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";

test("allows a user with an active membership", async () => {
  let lookupArguments: string[] = [];

  await requireWorkspaceMembership(workspaceId, userId, async (workspace, user) => {
    lookupArguments = [workspace, user];
    return true;
  });

  assert.deepEqual(lookupArguments, [workspaceId, userId]);
});

test("denies a user without an active membership", async () => {
  await assert.rejects(
    () => requireWorkspaceMembership(workspaceId, userId, async () => false),
    (error: unknown) => error instanceof WorkspaceAccessDeniedError
      && error.code === "workspace_access_denied",
  );
});

test("rejects malformed identifiers before querying membership", async () => {
  let lookupCount = 0;

  await assert.rejects(
    () => requireWorkspaceMembership("not-a-workspace", userId, async () => {
      lookupCount += 1;
      return true;
    }),
    WorkspaceAccessDeniedError,
  );

  assert.equal(lookupCount, 0);
});

test("does not hide membership database failures", async () => {
  const databaseError = new Error("database unavailable");

  await assert.rejects(
    () => requireWorkspaceMembership(workspaceId, userId, async () => {
      throw databaseError;
    }),
    (error: unknown) => error === databaseError,
  );
});
