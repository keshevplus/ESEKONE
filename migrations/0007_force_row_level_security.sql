ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_identity_read ON users
 FOR SELECT USING (identity_subject = current_setting('app.identity_subject', true));
CREATE POLICY users_identity_insert ON users
 FOR INSERT WITH CHECK (identity_subject = current_setting('app.identity_subject', true));

-- Force RLS even for table owners. Superusers and BYPASSRLS roles must
-- never be used by the application runtime.
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
