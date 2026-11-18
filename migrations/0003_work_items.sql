CREATE TABLE work_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
 title text NOT NULL,
 description text,
 status text NOT NULL DEFAULT 'backlog',
 priority text NOT NULL DEFAULT 'normal',
 due_at timestamptz,
 assigned_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
 assigned_agent text,
 acceptance_criteria text,
 latest_evidence text,
 next_action text,
 created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT work_items_status_check CHECK (status IN ('backlog','ready','in_progress','blocked','review','testing','done')),
 CONSTRAINT work_items_priority_check CHECK (priority IN ('low','normal','high','urgent'))
);
CREATE INDEX work_items_workspace_status_idx ON work_items(workspace_id,status,updated_at DESC);
CREATE INDEX work_items_workspace_assignee_idx ON work_items(workspace_id,assigned_user_id,status);
CREATE TABLE work_item_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
 work_item_id uuid NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
 actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
 event_type text NOT NULL,
 from_status text,
 to_status text,
 detail text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX work_item_events_item_created_idx ON work_item_events(work_item_id,created_at DESC);
CREATE TABLE agent_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
 work_item_id uuid NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
 requested_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
 agent_key text NOT NULL DEFAULT 'admin',
 prompt text NOT NULL,
 status text NOT NULL DEFAULT 'queued',
 result_summary text,
 created_at timestamptz NOT NULL DEFAULT now(),
 started_at timestamptz,
 completed_at timestamptz,
 CONSTRAINT agent_requests_status_check CHECK (status IN ('queued','running','waiting_approval','completed','failed','cancelled'))
);
CREATE INDEX agent_requests_queue_idx ON agent_requests(status,created_at);
CREATE INDEX agent_requests_workspace_idx ON agent_requests(workspace_id,created_at DESC);
ALTER TABLE work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_item_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY work_items_workspace_access ON work_items
 FOR ALL USING (workspace_id::text = current_setting('app.workspace_id', true))
 WITH CHECK (workspace_id::text = current_setting('app.workspace_id', true));
CREATE POLICY work_item_events_workspace_access ON work_item_events
 FOR ALL USING (workspace_id::text = current_setting('app.workspace_id', true))
 WITH CHECK (workspace_id::text = current_setting('app.workspace_id', true));
CREATE POLICY agent_requests_workspace_access ON agent_requests
 FOR ALL USING (workspace_id::text = current_setting('app.workspace_id', true))
 WITH CHECK (workspace_id::text = current_setting('app.workspace_id', true));
