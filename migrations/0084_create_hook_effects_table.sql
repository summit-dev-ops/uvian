-- Create hook_effects table for extensible hook actions
-- Part 1/3: Create table structure

-- hook_effects: effects that fire when hook triggers
CREATE TABLE core_automation.hook_effects (
    hook_id UUID NOT NULL REFERENCES core_automation.hooks(id) ON DELETE CASCADE,
    effect_type TEXT NOT NULL CHECK (
        effect_type IN ('load_mcp', 'load_skill', 'interrupt', 'block', 'log')
    ),
    effect_id UUID,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (hook_id, effect_type, effect_id)
);

CREATE INDEX idx_hook_effects_hook_id ON core_automation.hook_effects(hook_id);

-- RLS for hook_effects (mirrors agent_hooks)
ALTER TABLE core_automation.hook_effects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own hook_effects"
    ON core_automation.hook_effects FOR SELECT
    USING (
        hook_id IN (
            SELECT h.id FROM core_automation.hooks h
            INNER JOIN core_automation.agents a ON h.account_id = a.account_id
            WHERE a.user_id = auth.uid()
        )
    );

CREATE POLICY "Owner can manage own hook_effects"
    ON core_automation.hook_effects FOR ALL
    USING (
        hook_id IN (
            SELECT h.id FROM core_automation.hooks h
            INNER JOIN core_automation.agents a ON h.account_id = a.account_id
            WHERE a.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role full access hook_effects"
    ON core_automation.hook_effects FOR ALL
    USING (true) WITH CHECK (true);

-- Update view to include effects
DROP VIEW IF EXISTS core_automation.v_agent_hooks_for_worker;

CREATE VIEW core_automation.v_agent_hooks_for_worker AS
SELECT
    ah.agent_id,
    h.id AS hook_id,
    h.account_id,
    h.name,
    h.trigger_json,
    h.action AS hook_action,
    h.config AS hook_config,
    h.is_active,
    he.effect_type,
    he.effect_id,
    he.config AS effect_config
FROM core_automation.hooks h
INNER JOIN core_automation.agent_hooks ah ON h.id = ah.hook_id
LEFT JOIN core_automation.hook_effects he ON h.id = he.hook_id
WHERE h.is_active = true;

GRANT SELECT ON core_automation.v_agent_hooks_for_worker TO authenticated, service_role;
GRANT SELECT ON core_automation.hook_effects TO authenticated, service_role;