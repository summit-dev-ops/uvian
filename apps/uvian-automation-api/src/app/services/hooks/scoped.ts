import {
  ServiceClients,
  HookScopedService,
  CreateHookPayload,
  UpdateHookPayload,
  ListHooksFilters,
  HookRecord,
  AddEffectPayload,
  HookEffect,
  EffectType,
} from './types';

export function createHookScopedService(
  clients: ServiceClients,
): HookScopedService {
  return {
    async create(payload: CreateHookPayload): Promise<{ hookId: string }> {
      const { data, error } = await clients.adminClient
        .schema('core_automation')
        .from('hooks')
        .insert({
          account_id: payload.accountId,
          name: payload.name,
          trigger_json: payload.triggerJson,
          action: payload.action,
          config: payload.config || {},
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      return { hookId: data.id };
    },

    async list(
      filters: ListHooksFilters,
    ): Promise<{ hooks: HookRecord[] }> {
      const { data, error } = await clients.userClient
        .schema('core_automation')
        .from('hooks')
        .select('*')
        .or(
          `account_id.eq.${filters.accountId},and(is_active.eq.true)`,
        )
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);

      return {
        hooks: (data || []).map(mapRow),
      };
    },

    async get(hookId: string): Promise<HookRecord | null> {
      const { data, error } = await clients.userClient
        .schema('core_automation')
        .from('hooks')
        .select('*')
        .eq('id', hookId)
        .single();

      if (error || !data) return null;
      return mapRow(data);
    },

    async update(
      hookId: string,
      payload: UpdateHookPayload,
    ): Promise<HookRecord> {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (payload.name) updateData.name = payload.name;
      if (payload.triggerJson) updateData.trigger_json = payload.triggerJson;
      if (payload.action) updateData.action = payload.action;
      if (payload.config) updateData.config = payload.config;
      if (payload.isActive !== undefined)
        updateData.is_active = payload.isActive;

      const { data, error } = await clients.adminClient
        .schema('core_automation')
        .from('hooks')
        .update(updateData)
        .eq('id', hookId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return mapRow(data);
    },

    async delete(hookId: string): Promise<{ success: boolean }> {
      const { error } = await clients.adminClient
        .schema('core_automation')
        .from('hooks')
        .delete()
        .eq('id', hookId);

      if (error) throw new Error('Cannot delete hook');
      return { success: true };
    },

    async linkToAgent(
      hookId: string,
      agentId: string,
    ): Promise<{ success: boolean }> {
      const { error } = await clients.adminClient
        .schema('core_automation')
        .from('agent_hooks')
        .insert({
          agent_id: agentId,
          hook_id: hookId,
        });

      if (error) throw new Error('Cannot link hook to agent');
      return { success: true };
    },

    async unlinkFromAgent(
      hookId: string,
      agentId: string,
    ): Promise<{ success: boolean }> {
      const { error } = await clients.adminClient
        .schema('core_automation')
        .from('agent_hooks')
        .delete()
        .eq('agent_id', agentId)
        .eq('hook_id', hookId);

      if (error) throw new Error('Cannot unlink hook from agent');
      return { success: true };
    },

    async addEffect(
      hookId: string,
      payload: AddEffectPayload,
    ): Promise<{ success: boolean }> {
      const { error } = await clients.adminClient
        .schema('core_automation')
        .from('hook_effects')
        .insert({
          hook_id: hookId,
          effect_type: payload.effectType,
          effect_id: payload.effectId || null,
          config: payload.config || {},
        });

      if (error) throw new Error('Cannot add effect to hook');
      return { success: true };
    },

    async removeEffect(
      hookId: string,
      effectType: EffectType,
      effectId: string,
    ): Promise<{ success: boolean }> {
      const { error } = await clients.adminClient
        .schema('core_automation')
        .from('hook_effects')
        .delete()
        .eq('hook_id', hookId)
        .eq('effect_type', effectType)
        .eq('effect_id', effectId);

      if (error) throw new Error('Cannot remove effect from hook');
      return { success: true };
    },

    async listEffects(hookId: string): Promise<{ effects: HookEffect[] }> {
      const { data, error } = await clients.userClient
        .schema('core_automation')
        .from('hook_effects')
        .select('*')
        .eq('hook_id', hookId);

      if (error) throw new Error(error.message);

      return {
        effects: (data || []).map((row: unknown) => {
          const r = row as Record<string, unknown>;
          return {
            effectType: r.effect_type as string,
            effectId: r.effect_id as string | null,
            config: r.config as Record<string, unknown>,
          };
        }),
      };
    },
  };
}

function mapRow(row: unknown): HookRecord {
  const r = row as Record<string, unknown>;
  return {
    hookId: r.id as string,
    accountId: r.account_id as string,
    name: r.name as string,
    triggerJson: r.trigger_json as { type: string; pattern: string },
    action: r.action as string,
    config: r.config as Record<string, unknown>,
    isActive: r.is_active as boolean,
    createdAt: r.created_at as string,
  };
}
