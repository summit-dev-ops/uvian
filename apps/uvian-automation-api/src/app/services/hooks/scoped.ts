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
  async function verifyHookAccess(hookId: string): Promise<void> {
    const { data, error } = await clients.userClient
      .schema('core_automation')
      .from('hooks')
      .select('id, account_id')
      .eq('id', hookId)
      .single();

    if (error || !data) throw new Error('Hook not found or access denied');

    const { data: memberData, error: memberError } = await clients.userClient
      .schema('public')
      .from('account_members')
      .select('account_id')
      .eq('account_id', data.account_id)
      .eq('user_id', (await clients.userClient.auth.getUser()).data.user?.id)
      .single();

    if (memberError || !memberData) throw new Error('Access denied to hook');
  }

  async function verifyAccountAdmin(accountId: string): Promise<void> {
    const userId = (await clients.userClient.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const { data, error } = await clients.userClient
      .schema('public')
      .from('account_members')
      .select('role')
      .eq('account_id', accountId)
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new Error('Not a member of account');
    const role = data.role as { name?: string };
    if (!role.name || !['owner', 'admin'].includes(role.name)) {
      throw new Error('Not an admin of account');
    }
  }

  return {
    async create(payload: CreateHookPayload): Promise<{ hookId: string }> {
      await verifyAccountAdmin(payload.accountId);

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
      filters: ListHooksFilters = {},
    ): Promise<{ hooks: HookRecord[] }> {
      const userId = (await clients.userClient.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const { data: memberData, error: memberError } = await clients.userClient
        .schema('public')
        .from('account_members')
        .select('account_id')
        .eq('user_id', userId);

      if (memberError || !memberData) {
        return { hooks: [] };
      }

      const accountIds = memberData.map((m) => m.account_id);

      let q = clients.userClient
        .schema('core_automation')
        .from('hooks')
        .select('*')
        .in('account_id', accountIds);

      if (filters.isActive !== undefined) {
        q = q.eq('is_active', filters.isActive);
      }

      const { data, error } = await q;
      if (error) throw new Error(error.message);

      return {
        hooks: (data || []).map(mapRow),
      };
    },

    async get(hookId: string): Promise<HookRecord | null> {
      await verifyHookAccess(hookId);

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
      await verifyHookAccess(hookId);

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
      await verifyHookAccess(hookId);

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
      await verifyHookAccess(hookId);

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
      await verifyHookAccess(hookId);

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
      await verifyHookAccess(hookId);

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
      await verifyHookAccess(hookId);

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
      await verifyHookAccess(hookId);

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
