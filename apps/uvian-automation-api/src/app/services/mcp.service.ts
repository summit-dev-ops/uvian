import { SupabaseClient } from '@supabase/supabase-js';

export interface Clients {
  adminClient: SupabaseClient;
  userClient: SupabaseClient;
}

export interface CreateMcpPayload {
  accountId: string;
  name: string;
  type: string;
  url?: string;
  authMethod: string;
  config?: Record<string, unknown>;
}

export interface UpdateMcpPayload {
  name?: string;
  type?: string;
  url?: string;
  authMethod?: string;
  config?: Record<string, unknown>;
  isActive?: boolean;
}

export class McpService {
  async create(clients: Clients, payload: CreateMcpPayload) {
    const { data, error } = await clients.adminClient
      .schema('core_automation')
      .from('mcps')
      .insert({
        account_id: payload.accountId,
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
    return this.mapRow(data);
  }

  async list(clients: Clients, accountId: string) {
    const { data, error } = await clients.userClient
      .schema('core_automation')
      .from('mcps')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map((row: any) => this.mapRow(row));
  }

  async get(clients: Clients, mcpId: string) {
    const { data, error } = await clients.userClient
      .schema('core_automation')
      .from('mcps')
      .select('*')
      .eq('id', mcpId)
      .single();

    if (error || !data) throw new Error('MCP not found');
    return this.mapRow(data);
  }

  async update(clients: Clients, mcpId: string, payload: UpdateMcpPayload) {
    const updateData: Record<string, unknown> = {};

    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.type !== undefined) updateData.type = payload.type;
    if (payload.url !== undefined) updateData.url = payload.url;
    if (payload.authMethod !== undefined)
      updateData.auth_method = payload.authMethod;
    if (payload.config !== undefined) updateData.config = payload.config;
    if (payload.isActive !== undefined) updateData.is_active = payload.isActive;

    const { data, error } = await clients.adminClient
      .schema('core_automation')
      .from('mcps')
      .update(updateData)
      .eq('id', mcpId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapRow(data);
  }

  async delete(clients: Clients, mcpId: string) {
    const { error } = await clients.adminClient
      .schema('core_automation')
      .from('mcps')
      .delete()
      .eq('id', mcpId);

    if (error) throw new Error('Cannot delete MCP');
    return { success: true };
  }

  private mapRow(row: any) {
    return {
      id: row.id,
      accountId: row.account_id,
      name: row.name,
      type: row.type,
      url: row.url,
      authMethod: row.auth_method,
      config: row.config,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const mcpService = new McpService();
