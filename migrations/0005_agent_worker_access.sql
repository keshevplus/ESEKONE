-- Agent-worker access is global across workspaces but limited to queue/task
-- operations and enabled only in a transaction opened by the authenticated
-- internal worker handler. The worker has no access to contacts or user PII.
CREATE POLICY agent_requests_worker_select ON agent_requests
 FOR SELECT USING (current_setting('app.agent_worker', true) = 'true');
CREATE POLICY agent_requests_worker_update ON agent_requests
 FOR UPDATE
 USING (current_setting('app.agent_worker', true) = 'true')
 WITH CHECK (current_setting('app.agent_worker', true) = 'true');
CREATE POLICY work_items_worker_select ON work_items
 FOR SELECT USING (current_setting('app.agent_worker', true) = 'true');
CREATE POLICY work_items_worker_update ON work_items
 FOR UPDATE
 USING (current_setting('app.agent_worker', true) = 'true')
 WITH CHECK (current_setting('app.agent_worker', true) = 'true');
CREATE POLICY work_item_events_worker_insert ON work_item_events
 FOR INSERT WITH CHECK (current_setting('app.agent_worker', true) = 'true');
