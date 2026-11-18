-- Apply with a dedicated PostgreSQL application role that is NOT a superuser
-- and does NOT have BYPASSRLS. Keep schema-owner credentials out of runtime.
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_member_read ON workspaces
  FOR SELECT USING (
    id::text = current_setting('app.workspace_id', true)
    OR id IN (
      SELECT workspace_id FROM memberships
      WHERE user_id::text = current_setting('app.user_id', true)
        AND status = 'active'
    )
  );
CREATE POLICY membership_self_read ON memberships
  FOR SELECT USING (
    user_id::text = current_setting('app.user_id', true)
    OR workspace_id::text = current_setting('app.workspace_id', true)
  );
CREATE POLICY audit_workspace_read ON audit_events
  FOR SELECT USING (workspace_id::text = current_setting('app.workspace_id', true));
CREATE POLICY organization_workspace_read ON organizations
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.organization_id = organizations.id
      AND w.id::text = current_setting('app.workspace_id', true)
  ));
