-- Apply after the Drizzle baseline migration. Run the application with a dedicated
-- PostgreSQL role that is NOT a superuser and does NOT have BYPASSRLS.
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_member_access ON workspaces
  USING (id::text = current_setting('app.workspace_id', true));

CREATE POLICY membership_self_or_workspace ON memberships
  USING (
    user_id::text = current_setting('app.user_id', true)
    OR workspace_id::text = current_setting('app.workspace_id', true)
  );

CREATE POLICY audit_workspace_access ON audit_events
  USING (workspace_id::text = current_setting('app.workspace_id', true));

CREATE POLICY organization_workspace_access ON organizations
  USING (EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.organization_id = organizations.id
      AND w.id::text = current_setting('app.workspace_id', true)
  ));
