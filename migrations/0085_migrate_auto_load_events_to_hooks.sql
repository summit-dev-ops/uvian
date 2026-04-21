-- Migrate auto_load_events from MCPs/Skills to hooks system
-- Part 2/3: Convert existing auto_load_events to hooks + effects
-- NOTE: Run this AFTER 0084_create_hook_effects_table.sql

-- 1. Migrate MCPs with auto_load_events
-- For each MCP that has auto_load_events, create a hook and link to agents

INSERT INTO core_automation.hooks (
    id,
    account_id,
    name,
    trigger_json,
    action,
    config,
    is_active,
    created_at,
    updated_at
)
SELECT
    uuid_generate_v4(),
    account_id,
    'auto-load-' || name,
    jsonb_build_object(
        'type', 'event',
        'patterns', COALESCE(auto_load_events, '{}')
    ),
    'log',
    '{}'::jsonb,
    true,
    now(),
    now()
FROM core_automation.mcps
WHERE array_length(auto_load_events, 1) > 0;

-- 2. For each migrated hook, add load_mcp effect

INSERT INTO core_automation.hook_effects (
    hook_id,
    effect_type,
    effect_id,
    config,
    created_at
)
SELECT
    h.id,
    'load_mcp',
    m.id,
    '{}'::jsonb,
    now()
FROM core_automation.hooks h
INNER JOIN core_automation.mcps m ON h.account_id = m.account_id AND h.name = 'auto-load-' || m.name
WHERE m.auto_load_events IS NOT NULL AND array_length(m.auto_load_events, 1) > 0;

-- 3. Link migrated hooks to agents that have the MCP

INSERT INTO core_automation.agent_hooks (
    agent_id,
    hook_id,
    created_at
)
SELECT DISTINCT
    am.agent_id,
    h.id,
    now()
FROM core_automation.hooks h
INNER JOIN core_automation.mcps m ON h.account_id = m.account_id AND h.name = 'auto-load-' || m.name
INNER JOIN core_automation.agent_mcps am ON m.id = am.mcp_id
WHERE m.auto_load_events IS NOT NULL AND array_length(m.auto_load_events, 1) > 0
AND NOT EXISTS (
    SELECT 1 FROM core_automation.agent_hooks ah2 
    WHERE ah2.agent_id = am.agent_id AND ah2.hook_id = h.id
);

-- 4. Migrate Skills with auto_load_events

INSERT INTO core_automation.hooks (
    id,
    account_id,
    name,
    trigger_json,
    action,
    config,
    is_active,
    created_at,
    updated_at
)
SELECT
    uuid_generate_v4(),
    account_id,
    'auto-load-' || name,
    jsonb_build_object(
        'type', 'event',
        'patterns', COALESCE(auto_load_events, '{}')
    ),
    'log',
    '{}'::jsonb,
    true,
    now(),
    now()
FROM core_automation.skills
WHERE array_length(auto_load_events, 1) > 0;

-- 5. For each migrated skill hook, add load_skill effect

INSERT INTO core_automation.hook_effects (
    hook_id,
    effect_type,
    effect_id,
    config,
    created_at
)
SELECT
    h.id,
    'load_skill',
    s.id,
    '{}'::jsonb,
    now()
FROM core_automation.hooks h
INNER JOIN core_automation.skills s ON h.account_id = s.account_id AND h.name = 'auto-load-' || s.name
WHERE s.auto_load_events IS NOT NULL AND array_length(s.auto_load_events, 1) > 0;

-- 6. Link skill hooks to agents that have the skill

INSERT INTO core_automation.agent_hooks (
    agent_id,
    hook_id,
    created_at
)
SELECT DISTINCT
    ass1.agent_id,
    h.id,
    now()
FROM core_automation.hooks h
INNER JOIN core_automation.skills s ON h.account_id = s.account_id AND h.name = 'auto-load-' || s.name
INNER JOIN core_automation.agent_skills ass1 ON s.id = ass1.skill_id
WHERE s.auto_load_events IS NOT NULL AND array_length(s.auto_load_events, 1) > 0
AND NOT EXISTS (
    SELECT 1 FROM core_automation.agent_hooks ah2 
    WHERE ah2.agent_id = ass1.agent_id AND ah2.hook_id = h.id
);