-- Add expect_tool_call effect type to hook system
-- Adds 'expect_tool_call' to the effect_type check constraint

ALTER TABLE core_automation.hook_effects DROP CONSTRAINT hook_effects_effect_type_check;

ALTER TABLE core_automation.hook_effects ADD CONSTRAINT hook_effects_effect_type_check CHECK (
    effect_type IN ('load_mcp', 'load_skill', 'interrupt', 'block', 'log', 'expect_tool_call')
);