-- Table for uvian-api (validation during /api/auth/get-jwt)
CREATE TABLE IF NOT EXISTS agent_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key_hash TEXT NOT NULL,
  api_key_prefix TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table for uvian-automation-api (worker fetches key from here)
CREATE TABLE IF NOT EXISTS automation_agent_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_api_key TEXT NOT NULL,
  api_key_prefix TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_api_keys_prefix ON agent_api_keys(api_key_prefix);
CREATE INDEX IF NOT EXISTS idx_automation_agent_keys_user_id ON automation_agent_keys(user_id);

ALTER TABLE agent_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_agent_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage agent_api_keys" ON agent_api_keys;
CREATE POLICY "Service role can manage agent_api_keys" ON agent_api_keys FOR ALL TO "service_role" USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage automation_agent_keys" ON automation_agent_keys;
CREATE POLICY "Service role can manage automation_agent_keys" ON automation_agent_keys FOR ALL TO "service_role" USING (true) WITH CHECK (true);
