-- Force RLS so table owners are also subject to the policies. The deployed
-- runtime role must still be a non-superuser without BYPASSRLS and must not
-- own these tables; the migration role is separate.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

ALTER TABLE organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE workspaces FORCE ROW LEVEL SECURITY;
ALTER TABLE memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_events FORCE ROW LEVEL SECURITY;
ALTER TABLE contacts FORCE ROW LEVEL SECURITY;
ALTER TABLE work_items FORCE ROW LEVEL SECURITY;
ALTER TABLE work_item_events FORCE ROW LEVEL SECURITY;
ALTER TABLE agent_requests FORCE ROW LEVEL SECURITY;
ALTER TABLE projects FORCE ROW LEVEL SECURITY;

-- A verified OIDC subject may resolve only its matching local account. Once
-- app.user_id has been established, the same user's row is available inside
-- workspace and current-user transactions.
CREATE POLICY users_self_read ON users
  FOR SELECT USING (
    identity_subject = current_setting('app.identity_subject', true)
    OR id::text = current_setting('app.user_id', true)
  );

-- Initial account creation is allowed only for the verified OIDC subject
-- placed into this transaction by withIdentityContext().
CREATE POLICY users_identity_insert ON users
  FOR INSERT WITH CHECK (
    identity_subject = current_setting('app.identity_subject', true)
  );

-- Audit history is append-only to the app role. There are no UPDATE/DELETE
-- policies. A write must match both the active workspace and acting user.
CREATE POLICY audit_workspace_insert ON audit_events
  FOR INSERT WITH CHECK (
    workspace_id::text = current_setting('app.workspace_id', true)
    AND actor_user_id::text = current_setting('app.user_id', true)
  );
