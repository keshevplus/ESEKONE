CREATE TABLE projects (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
 name text NOT NULL,
 description text,
 status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','active','on_hold','completed','archived')),
 owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
 start_at timestamptz,
 due_at timestamptz,
 created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT projects_id_workspace_unique UNIQUE(id,workspace_id)
);
CREATE INDEX projects_workspace_status_idx ON projects(workspace_id,status,updated_at DESC);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY projects_workspace_access ON projects
 FOR ALL USING (workspace_id::text = current_setting('app.workspace_id', true))
 WITH CHECK (workspace_id::text = current_setting('app.workspace_id', true));
ALTER TABLE work_items ADD COLUMN project_id uuid;
ALTER TABLE work_items ADD CONSTRAINT work_items_project_workspace_fk
 FOREIGN KEY(project_id,workspace_id) REFERENCES projects(id,workspace_id) ON DELETE RESTRICT;
CREATE INDEX work_items_project_idx ON work_items(workspace_id,project_id,status);
