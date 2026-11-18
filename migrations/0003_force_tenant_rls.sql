-- Ensure table owners obey tenant policies too. The runtime DB role must still
-- be a separate non-superuser role without BYPASSRLS.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

ALTER TABLE organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE workspaces FORCE ROW LEVEL SECURITY;
ALTER TABLE memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_events FORCE ROW LEVEL SECURITY;
ALTER TABLE contacts FORCE ROW LEVEL SECURITY;

CREATE POLICY users_self_read ON users
  FOR SELECT USING (
    identity_subject = current_setting('app.identity_subject', true)
    OR id::text = current_setting('app.user_id', true)
  );

-- Audit history is append-only from the application. There are deliberately
-- no UPDATE or DELETE policies for the runtime role.
CREATE POLICY audit_workspace_insert ON audit_events
  FOR INSERT WITH CHECK (
    workspace_id::text = current_setting('app.workspace_id', true)
    AND actor_user_id::text = current_setting('app.user_id', true)
  );
