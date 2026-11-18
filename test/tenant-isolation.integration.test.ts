import assert from "node:assert/strict";
import test from "node:test";
import pg from "pg";
import { eq, sql } from "drizzle-orm";
import { db } from "../src/db/client.js";
import { agentRequests, contacts, users, workItems } from "../src/db/schema.js";
import {
  withAgentWorkerContext,
  withIdentityContext,
  withWorkspaceContext,
  WorkspaceAccessDeniedError,
} from "../src/db/tenant.js";

const enabled = process.env.RUN_DATABASE_INTEGRATION === "true";
const runtimeUrl = process.env.DATABASE_URL;
const migrationUrl = process.env.DATABASE_MIGRATION_URL;

test("PostgreSQL RLS blocks cross-workspace reads and writes", { skip: !enabled || !runtimeUrl || !migrationUrl }, async () => {
  assert.ok(db, "runtime DATABASE_URL must initialize the application DB client");
  const admin = new pg.Pool({ connectionString: migrationUrl });
  const tag = "rls-it-" + Date.now() + "-" + Math.random().toString(16).slice(2);

  let userA = "";
  let userB = "";
  let organizationA = "";
  let organizationB = "";
  let workspaceA = "";
  let workspaceB = "";
  let contactA = "";
  let workItemA = "";
  let agentRequestA = "";

  try {
    const runtime = await db.execute(
      sql`SELECT current_user AS role_name, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user`,
    );
    assert.equal(runtime.rows[0]?.rolsuper, false, "runtime role must not be superuser");
    assert.equal(runtime.rows[0]?.rolbypassrls, false, "runtime role must not bypass RLS");

    const insertedUsers = await admin.query(
      "INSERT INTO users (identity_subject,email,display_name) VALUES ($1,$2,$3),($4,$5,$6) RETURNING id,identity_subject",
      [tag + "-subject-a", tag + "-a@example.test", "RLS test A",
       tag + "-subject-b", tag + "-b@example.test", "RLS test B"],
    );
    userA = insertedUsers.rows[0].id;
    userB = insertedUsers.rows[1].id;

    const insertedOrganizations = await admin.query(
      "INSERT INTO organizations (name,slug) VALUES ($1,$2),($3,$4) RETURNING id",
      [tag + " Org A", tag + "-org-a", tag + " Org B", tag + "-org-b"],
    );
    organizationA = insertedOrganizations.rows[0].id;
    organizationB = insertedOrganizations.rows[1].id;

    const insertedWorkspaces = await admin.query(
      "INSERT INTO workspaces (organization_id,name,slug) VALUES ($1,$2,$3),($4,$5,$6) RETURNING id",
      [organizationA, tag + " Workspace A", tag + "-workspace-a",
       organizationB, tag + " Workspace B", tag + "-workspace-b"],
    );
    workspaceA = insertedWorkspaces.rows[0].id;
    workspaceB = insertedWorkspaces.rows[1].id;

    await admin.query(
      "INSERT INTO memberships (workspace_id,user_id,role,status) VALUES ($1,$2,'owner','active'),($3,$4,'owner','active')",
      [workspaceA, userA, workspaceB, userB],
    );

    const insertedContacts = await admin.query(
      "INSERT INTO contacts (workspace_id,full_name,email) VALUES ($1,$2,$3),($4,$5,$6) RETURNING id",
      [workspaceA, tag + " Contact A", tag + "-contact-a@example.test",
       workspaceB, tag + " Contact B", tag + "-contact-b@example.test"],
    );
    contactA = insertedContacts.rows[0].id;

    const ownUser = await withIdentityContext(tag + "-subject-a", async (tx) =>
      tx.select({ id: users.id }).from(users),
    );
    assert.deepEqual(ownUser.map((row: { id: string }) => row.id), [userA]);

    const ownContacts = await withWorkspaceContext(workspaceA, userA, async (tx) =>
      tx.select({ id: contacts.id }).from(contacts).orderBy(contacts.id),
    );
    assert.deepEqual(ownContacts.map((row: { id: string }) => row.id), [contactA]);

    const crossTenantRead = await withWorkspaceContext(workspaceA, userA, async (tx) =>
      tx.select({ id: contacts.id }).from(contacts).where(eq(contacts.workspaceId, workspaceB)),
    );
    assert.deepEqual(crossTenantRead, []);

    await assert.rejects(
      () => withWorkspaceContext(workspaceB, userA, async (tx) =>
        tx.select({ id: contacts.id }).from(contacts),
      ),
      WorkspaceAccessDeniedError,
    );

    await assert.rejects(
      () => withWorkspaceContext(workspaceA, userA, async (tx) =>
        tx.insert(contacts).values({
          workspaceId: workspaceB,
          fullName: tag + " Illegal cross-tenant insert",
          email: tag + "-illegal@example.test",
        }),
      ),
      /row-level security|policy/i,
    );

    const createdWorkItem = await admin.query(
      "INSERT INTO work_items (workspace_id,title,status) VALUES ($1,$2,'ready') RETURNING id",
      [workspaceA, tag + " Worker task"],
    );
    workItemA = createdWorkItem.rows[0].id;

    const createdAgentRequest = await admin.query(
      "INSERT INTO agent_requests (workspace_id,work_item_id,agent_key,prompt) VALUES ($1,$2,'qa-agent',$3) RETURNING id",
      [workspaceA, workItemA, tag + " Worker prompt"],
    );
    agentRequestA = createdAgentRequest.rows[0].id;

    const workerRows = await withAgentWorkerContext(async (tx) => {
      const [requests, tasks, privateContacts] = await Promise.all([
        tx.select({ id: agentRequests.id }).from(agentRequests),
        tx.select({ id: workItems.id }).from(workItems),
        tx.select({ id: contacts.id }).from(contacts),
      ]);
      return { requests, tasks, privateContacts };
    });
    assert.ok(workerRows.requests.some((row: { id: string }) => row.id === agentRequestA));
    assert.ok(workerRows.tasks.some((row: { id: string }) => row.id === workItemA));
    assert.deepEqual(workerRows.privateContacts, [], "agent worker must not read CRM contacts");
  } finally {
    if (organizationA || organizationB) {
      await admin.query(
        "DELETE FROM organizations WHERE id = ANY($1::uuid[])",
        [[organizationA, organizationB].filter(Boolean)],
      );
    }
    if (userA || userB) {
      await admin.query(
        "DELETE FROM users WHERE id = ANY($1::uuid[])",
        [[userA, userB].filter(Boolean)],
      );
    }
    await admin.end();
  }
});
