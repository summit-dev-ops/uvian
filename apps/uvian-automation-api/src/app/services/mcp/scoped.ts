import {
  ServiceClients,
  McpScopedService,
  CreateMcpPayload,
  UpdateMcpPayload,
  McpRecord,
} from './types';

export function createMcpScopedService(
  clients: ServiceClients
): McpScopedService {
  return {
    async list(accountId: string): Promise<McpRecord[]> {
      const { data, error } = await clients.userClient
        .schema('core_automation')
        .from('mcps')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data || []).map((row: unknown) => mapRow(row));
    },

    async get(mcpId: string): Promise<McpRecord | null> {
      const { data, error } = await clients.userClient
        .schema('core_automation')
        .from('mcps')
        .select('*')
        .eq('id', mcpId)
        .single();

      if (error || !data) throw new Error('MCP not found');
      return mapRow(data);
    },

    async create(
      accountId: string,
      payload: CreateMcpPayload,
    ): Promise<McpRecord> {
      const { data, error } = await clients.adminClient
        .schema('core_automation')
        .from('mcps')
        .insert({
          account_id: accountId,
          name: payload.name,
          type: payload.type,
          url: payload.url || null,
          auth_method: payload.authMethod,
          config: payload.config || {},
          is_active: true,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return mapRow(data);
    },

    async update(mcpId: string, payload: UpdateMcpPayload): Promise<McpRecord> {
      const updateData: Record<string, unknown> = {};

      if (payload.name !== undefined) updateData.name = payload.name;
      if (payload.type !== undefined) updateData.type = payload.type;
      if (payload.url !== undefined) updateData.url = payload.url;
      if (payload.authMethod !== undefined)
        updateData.auth_method = payload.authMethod;
      if (payload.config !== undefined) updateData.config = payload.config;
      if (payload.isActive !== undefined)
        updateData.is_active = payload.isActive;

      const { data, error } = await clients.adminClient
        .schema('core_automation')
        .from('mcps')
        .update(updateData)
        .eq('id', mcpId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return mapRow(data);
    },

    async delete(mcpId: string): Promise<{ success: boolean }> {
      const { error } = await clients.adminClient
        .schema('core_automation')
        .from('mcps')
        .delete()
        .eq('id', mcpId);

      if (error) throw new Error('Cannot delete MCP');
      return { success: true };
    },
  };
}

function mapRow(row: unknown): McpRecord {
  const r = row as Record<string, unknown>;
  return {
    id: r.id as string,
    accountId: r.account_id as string,
    name: r.name as string,
    type: r.type as string,
    url: r.url as string | undefined,
    authMethod: r.auth_method as string,
    config: r.config as Record<string, unknown>,
    isActive: r.is_active as boolean,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}
