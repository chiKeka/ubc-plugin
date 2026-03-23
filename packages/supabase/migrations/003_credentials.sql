-- Credential vault: encrypted credential storage with RLS

CREATE TYPE credential_type AS ENUM (
  'api_key',
  'oauth_token',
  'connection_string',
  'password',
  'other'
);

CREATE TABLE credential_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  source_id UUID NOT NULL REFERENCES compute_sources(id),
  credential_name TEXT NOT NULL,
  credential_type credential_type NOT NULL,
  encrypted_value TEXT NOT NULL,
  encryption_iv TEXT NOT NULL,
  encryption_tag TEXT NOT NULL,
  encryption_salt TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_credential_vault_user ON credential_vault(user_id);
CREATE INDEX idx_credential_vault_project ON credential_vault(project_id);
CREATE INDEX idx_credential_vault_source ON credential_vault(source_id);

-- Strict RLS: users can only access their own credentials
ALTER TABLE credential_vault ENABLE ROW LEVEL SECURITY;

CREATE POLICY credential_vault_owner ON credential_vault
  FOR ALL USING (auth.uid() = user_id);
