-- Bootstrap inserts are enabled only inside the authenticated onboarding transaction.
CREATE POLICY organizations_bootstrap_insert ON organizations
 FOR INSERT WITH CHECK (current_setting('app.bootstrap', true) = 'true');
CREATE POLICY workspaces_bootstrap_insert ON workspaces
 FOR INSERT WITH CHECK (current_setting('app.bootstrap', true) = 'true');
CREATE POLICY memberships_bootstrap_insert ON memberships
 FOR INSERT WITH CHECK (
  current_setting('app.bootstrap', true) = 'true'
  AND user_id::text = current_setting('app.user_id', true)
 );
