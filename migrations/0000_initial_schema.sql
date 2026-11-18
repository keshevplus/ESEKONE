CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 identity_subject text NOT NULL UNIQUE,
 email text NOT NULL UNIQUE,
 display_name text,
 active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE organizations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL,
 slug text NOT NULL UNIQUE,
 status text NOT NULL DEFAULT 'active',
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE workspaces (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
 name text NOT NULL,
 slug text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT workspaces_org_slug_unique UNIQUE(organization_id,slug)
);
CREATE INDEX workspaces_org_idx ON workspaces(organization_id);
CREATE TABLE memberships (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 role text NOT NULL DEFAULT 'member',
 status text NOT NULL DEFAULT 'active',
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT memberships_workspace_user_unique UNIQUE(workspace_id,user_id)
);
CREATE INDEX memberships_user_idx ON memberships(user_id,status);
CREATE TABLE audit_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
 actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
 action text NOT NULL,
 resource_type text NOT NULL,
 resource_id text,
 metadata text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_workspace_created_idx ON audit_events(workspace_id,created_at);
CREATE INDEX audit_actor_created_idx ON audit_events(actor_user_id,created_at);
