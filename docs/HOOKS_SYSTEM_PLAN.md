# Hooks & Effects System Plan

Extending the hooks system to handle auto-loading of MCPs and Skills via event-driven triggers.

## Status: IN PROGRESS

## Completed Work

### Database (Completed previously)

- hook_effects table created
- View updated with effects
- Migrations for existing data

### API (Completed previously)

- Hooks CRUD with effects management

### Worker (NOW COMPLETED)

- sync_node.py - uses get_hooks_for_event() instead of auto_load_events
- fetch_inbox_node.py - uses get_hooks_for_event() instead of auto_load_events
- agent_executor.py - passes available_hooks in state

## Architecture

### Database Tables

```
core_automation.hooks
├── id UUID PK
├── account_id UUID FK → accounts(id)
├── name TEXT
├── trigger_json JSONB  -- {"type": "event", "patterns": [...]} OR {"type": "tool_name_prefix", "pattern": "..."}
├── action TEXT  -- 'interrupt', 'log', 'block' (governance only)
├── config JSONB
├── is_active BOOLEAN
├── created_at, updated_at

core_automation.hook_effects
├── hook_id UUID PK FK → hooks(id)
├── effect_type TEXT PK  -- 'load_mcp', 'load_skill', 'interrupt', 'block', 'log'
├── effect_id UUID PK   -- MCP/skill ID for load_* types
├── config JSONB
PRIMARY KEY (hook_id, effect_type, effect_id)

core_automation.agent_hooks (existing)
├── agent_id UUID PK FK → agents(id)
├── hook_id UUID PK FK → hooks(id)
```

### View

```sql
CREATE VIEW core_automation.v_agent_hooks_for_worker AS
SELECT
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
```

## Trigger Types

| Type               | Example                                                                              | Purpose            |
| ------------------ | ------------------------------------------------------------------------------------ | ------------------ |
| `event`            | `{"type": "event", "patterns": ["com.uvian.message.*", "com.uvian.ticket.created"]}` | Auto-load on event |
| `tool_name_prefix` | `{"type": "tool_name_prefix", "pattern": "http_*"}`                                  | Tool governance    |

## Effect Types

| Effect       | Config              | Purpose                |
| ------------ | ------------------- | ---------------------- |
| `load_mcp`   | `{effect_id: uuid}` | Auto-load MCP server   |
| `load_skill` | `{effect_id: uuid}` | Auto-load skill        |
| `interrupt`  | -                   | Create approval ticket |
| `block`      | -                   | Block execution        |
| `log`        | -                   | Log only               |

## Implementation

### Phase 1: Database Migrations (Separate)

**Migration 1: Create hook_effects table**

- Create `hook_effects` table with CHECK constraint
- Create index on `hook_id`
- Update `v_agent_hooks_for_worker` view

**Migration 2: Migrate auto_load_events**

- For each MCP with `auto_load_events`:
  - Create hook with `trigger_json = {type: "event", patterns: auto_load_events}`
  - Add `load_mcp` effect
  - Link to all agents that have the MCP
- For each skill with `auto_load_events`:
  - Create hook with `trigger_json = {type: "event", patterns: auto_load_events}`
  - Add `load_skill` effect
  - Link to all agents that have the skill

**Migration 3: Drop Deprecated Columns**

- Remove `auto_load_events` from `mcps` table
- Remove `auto_load_events` from `skills` table

### Phase 2: Automation API Updates

**File: `src/app/routes/hooks.ts`**

Add effect management routes:

```typescript
// POST /api/hooks/:id/effects
// {
//   effectType: 'load_mcp' | 'load_skill' | 'interrupt' | 'block' | 'log',
//   effectId?: string,
//   config?: object
// }

// DELETE /api/hooks/:id/effects/:type/:effectId

// GET /api/hooks/:id/effects
```

**File: `src/app/services/hooks/scoped.ts`**

Add service methods:

- `addEffect(hookId, payload)`
- `removeEffect(hookId, effectType, effectId)`
- `listEffects(hookId)`

### Phase 3: Worker Updates

**File: `apps/uvian-automation-worker/apps/uvian_automation_worker/core/agents/utils/loader.py`**

Replace separate skill/MCP filtering with unified hook-based loading:

```python
# Before: filter_skills() + filter_mcps() separately
# After: get_hooks_for_event() returns hooks with load_mcp/load_skill effects
```

Key changes:

1. `get_hooks_for_event(event_type, hooks)` - matches trigger.type="event" patterns
2. Extract MCPs to load from `effect_type='load_mcp'`
3. Extract skills to load from `effect_type='load_skill'`

**File: `apps/uvian-automation-worker/apps/uvian_automation_worker/core/agents/utils/tool_approval.py`**

- No changes needed - uses existing `action` column from hooks

**File: `apps/uvian-automation-worker/apps/uvian_automation_worker/clients/config.py`**

- No changes needed - `get_agent_hooks()` returns hooks + effects from view

## What Stays the Same

| Component                        | Action                   |
| -------------------------------- | ------------------------ |
| `/api/agents/:id/mcps` route     | Unchanged                |
| `/api/agents/:id/skills` route   | Unchanged                |
| `/api/agents/:id/hooks` route    | Unchanged (view updated) |
| MCP CRUD routes                  | Unchanged                |
| Skill CRUD routes                | Unchanged                |
| `v_agent_mcps_with_secrets` view | Keep                     |
| `v_agent_skills` view            | Keep                     |

## Benefits

1. **Single trigger system** - No more `auto_load_events` on two tables
2. **Composable** - One hook can load MCP + load skill + interrupt
3. **Extensible** - Easy to add new effect types
4. **No UI changes** - Keep existing MCP/skills management

## Implementation Summary

### Completed Changes

| File                                                         | Change                                                |
| ------------------------------------------------------------ | ----------------------------------------------------- |
| `migrations/0084_create_hook_effects_table.sql`              | NEW - Create hook_effects table                       |
| `migrations/0085_migrate_auto_load_events_to_hooks.sql`      | NEW - Migrate auto_load_events                        |
| `migrations/0086_drop_auto_load_events_columns.sql`          | NEW - Drop deprecated columns                         |
| `apps/uvian-automation-api/src/app/services/hooks/types.ts`  | Add EffectType, AddEffectPayload, HookEffect          |
| `apps/uvian-automation-api/src/app/services/hooks/scoped.ts` | Add addEffect, removeEffect, listEffects methods      |
| `apps/uvian-automation-api/src/app/routes/hooks.ts`          | Add POST/DELETE /api/hooks/:id/effects routes         |
| `apps/uvian-automation-api/src/app/types/hook.types.ts`      | Add TriggerJsonEvent, TriggerJsonToolNamePrefix types |
| `apps/uvian-automation-worker/.../loader.py`                 | Add get_hooks_for_event() (legacy still present)      |

### Legacy Fallback

- sync_node.py still uses mcp_mapping.py / skill_mapping.py
- loader.py filter_skills() / filter_mcps() kept as fallback
- Old routes remain functional

## Rollback Plan

If issues arise:

1. Migrations are separate for easy rollback
2. Original `auto_load_events` data exists in worker code as fallback until confirmed working
3. Old routes (`/api/agents/:id/mcps`, `/api/agents/:id/skills`) remain functional
