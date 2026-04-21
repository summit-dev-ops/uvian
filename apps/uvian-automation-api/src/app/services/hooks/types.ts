import { SupabaseClient } from '@supabase/supabase-js';

export interface ServiceClients {
  adminClient: SupabaseClient;
  userClient: SupabaseClient;
}

export type TriggerJson =
  | { type: 'event'; patterns: string[] }
  | { type: 'tool_name_prefix'; pattern: string };

export interface CreateHookPayload {
  accountId: string;
  name: string;
  triggerJson: TriggerJson;
  action: 'interrupt' | 'log' | 'block';
  config?: Record<string, unknown>;
}

export interface UpdateHookPayload {
  name?: string;
  triggerJson?: TriggerJson;
  action?: 'interrupt' | 'log' | 'block';
  config?: Record<string, unknown>;
  isActive?: boolean;
}

export interface HookRecord {
  hookId: string;
  accountId: string;
  name: string;
  triggerJson: { type: string; pattern: string };
  action: string;
  config: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
}

export interface ListHooksFilters {
  isActive?: boolean;
}

export interface HookScopedService {
  create(payload: CreateHookPayload): Promise<{ hookId: string }>;
  list(filters?: ListHooksFilters): Promise<{ hooks: HookRecord[] }>;
  get(hookId: string): Promise<HookRecord | null>;
  update(hookId: string, payload: UpdateHookPayload): Promise<HookRecord>;
  delete(hookId: string): Promise<{ success: boolean }>;
  linkToAgent(hookId: string, agentId: string): Promise<{ success: boolean }>;
  unlinkFromAgent(
    hookId: string,
    agentId: string,
  ): Promise<{ success: boolean }>;
  addEffect(
    hookId: string,
    payload: AddEffectPayload,
  ): Promise<{ success: boolean }>;
  removeEffect(
    hookId: string,
    effectType: EffectType,
    effectId: string,
  ): Promise<{ success: boolean }>;
  listEffects(hookId: string): Promise<{ effects: HookEffect[] }>;
}

export interface HookAdminService {
  getById(hookId: string): Promise<HookRecord | null>;
}

export type EffectType =
  | 'load_mcp'
  | 'load_skill'
  | 'interrupt'
  | 'block'
  | 'log';

export interface AddEffectPayload {
  effectType: EffectType;
  effectId?: string;
  config?: Record<string, unknown>;
}

export interface HookEffect {
  effectType: string;
  effectId: string | null;
  config: Record<string, unknown>;
}

export interface CreateHookServiceConfig {}
