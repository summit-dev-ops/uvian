-- =============================================================================
-- PHASE 49: SIMPLIFY SECRETS TABLE
-- Migration: 0049_simplify_secrets_table.sql
-- Purpose: Move secrets to public schema, simplify secret_type to value_type
-- (text/json), and let auth behavior be determined by junction table configs.
-- =============================================================================

BEGIN;

-- =============================================================================
-- STEP 1: BACKUP EXISTING SECRETS DATA
-- =============================================================================
ALTER TABLE core_automation.secrets RENAME TO secrets_backup;

-- =============================================================================
-- STEP 2: CREATE NEW PUBLIC.SECRETS TABLE WITH SIMPLIFIED SCHEMA
-- =============================================================================
CREATE TABLE public.secrets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    value_type TEXT NOT NULL CHECK (value_type IN ('text', 'json')),
    encrypted_value TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- STEP 3: COPY DATA WITH TYPE DETECTION
-- api_key_json becomes json, everything else becomes text
-- =============================================================================
INSERT INTO public.secrets (id, account_id, name, value_type, encrypted_value, metadata, is_active, created_at, updated_at)
SELECT 
    id, 
    account_id, 
    name, 
    CASE 
        WHEN secret_type = 'api_key_json' THEN 'json'
        ELSE 'text'
    END as value_type,
    encrypted_value, 
    metadata, 
    is_active, 
    created_at, 
    updated_at
FROM core_automation.secrets_backup;

-- =============================================================================
-- STEP 4: CREATE INDEXES
-- =============================================================================
CREATE INDEX idx_secrets_account_id ON public.secrets(account_id);

-- =============================================================================
-- STEP 5: ENABLE RLS
-- =============================================================================
ALTER TABLE public.secrets ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 6: CREATE RLS POLICIES (matching existing pattern)
-- =============================================================================
CREATE POLICY "Account members can view own secrets"
    ON public.secrets FOR SELECT
    USING (account_id IN (
        SELECT account_id FROM account_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Account members can manage own secrets"
    ON public.secrets FOR ALL
    USING (account_id IN (
        SELECT account_id FROM account_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Service role full access"
    ON public.secrets FOR ALL
    USING (true) WITH CHECK (true);

-- =============================================================================
-- STEP 7: UPDATE FOREIGN KEY REFERENCES IN JUNCTION TABLES
-- =============================================================================
ALTER TABLE core_automation.agent_llms 
    DROP CONSTRAINT IF EXISTS agent_llms_secret_id_fkey,
    ADD CONSTRAINT agent_llms_secret_id_fkey 
    FOREIGN KEY (secret_id) REFERENCES public.secrets(id) ON DELETE SET NULL;

ALTER TABLE core_automation.agent_mcps 
    DROP CONSTRAINT IF EXISTS agent_mcps_secret_id_fkey,
    ADD CONSTRAINT agent_mcps_secret_id_fkey 
    FOREIGN KEY (secret_id) REFERENCES public.secrets(id) ON DELETE SET NULL;

-- =============================================================================
-- STEP 8: CLEAN UP BACKUP
-- =============================================================================
DROP TABLE core_automation.secrets_backup;

COMMIT;
