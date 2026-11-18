CREATE TABLE contacts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
 full_name text NOT NULL,
 email text,
 phone text,
 company text,
 status text NOT NULL DEFAULT 'lead' CHECK (status IN ('lead','customer','inactive')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX contacts_workspace_created_idx ON contacts(workspace_id,created_at);
CREATE INDEX contacts_workspace_email_idx ON contacts(workspace_id,email);
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY contacts_workspace_access ON contacts
 FOR ALL
 USING (workspace_id::text = current_setting('app.workspace_id', true))
 WITH CHECK (workspace_id::text = current_setting('app.workspace_id', true));
