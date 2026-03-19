import { SupabaseClient } from '@supabase/supabase-js';
import { adminSupabase } from '../clients/supabase.client';
import { encrypt, decryptJson } from './encryption.service';

const ENCRYPTION_SECRET = process.env.INTERNAL_API_KEY!;

export interface CreateMcpPayload {
  accountId: string;
  name: string;
  type: string;
  url?: string;
  authMethod: string;
  authConfig?: Record<string, unknown>;
  config?: Record<string, unknown>;
}

export interface UpdateMcpPayload {
  name?: string;
  type?: string;
  url?: string;
  authMethod?: string;
  authConfig?: Record<string, unknown>;
  config?: Record<string, unknown>;
  isActive?: boolean;
}

export class McpService {
  async create(userClient: SupabaseClient, payload: CreateMcpPayload) {
    const encryptedAuthConfig = payload.authConfig
      ? encrypt(JSON.stringify(payload.authConfig), ENCRYPTION_SECRET)
      : null;

    const { data, error } = await adminSupabase
      .from('core_automation.mcps')
      .insert({
        account_id: payload.accountId,
        name: payload.name,
        type: payload.type,
        url: payload.url || null,
        auth_method: payload.authMethod,
        encrypted_auth_config: encryptedAuthConfig,
        config: payload.config || {},
        is_active: true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapRow(data);
  }

  async list(userClient: SupabaseClient, accountId: string) {
    const { data, error } = await userClient
      .from('core_automation.mcps')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map((row: any) => this.mapRow(row));
  }

  async get(userClient: SupabaseClient, mcpId: string) {
    const { data, error } = await userClient
      .from('core_automation.mcps')
      .select('*')
      .eq('id', mcpId)
      .single();

    if (error || !data) throw new Error('MCP not found');
    return this.mapRow(data);
  }

  async update(
    userClient: SupabaseClient,
    mcpId: string,
    payload: UpdateMcpPayload
  ) {
    const updateData: any = {};

    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.type !== undefined) updateData.type = payload.type;
    if (payload.url !== undefined) updateData.url = payload.url;
    if (payload.authMethod !== undefined)
      updateData.auth_method = payload.authMethod;
    if (payload.config !== undefined) updateData.config = payload.config;
    if (payload.isActive !== undefined) updateData.is_active = payload.isActive;
    if (payload.authConfig !== undefined) {
      updateData.encrypted_auth_config = payload.authConfig
        ? encrypt(JSON.stringify(payload.authConfig), ENCRYPTION_SECRET)
        : null;
    }

    const { data, error } = await adminSupabase
      .from('core_automation.mcps')
      .update(updateData)
      .eq('id', mcpId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapRow(data);
  }

  async delete(userClient: SupabaseClient, mcpId: string) {
    const { error } = await adminSupabase
      .from('core_automation.mcps')
      .delete()
      .eq('id', mcpId);

    if (error) throw new Error('Cannot delete MCP');
    return { success: true };
  }

  getDecryptedAuthConfig(encryptedAuthConfig: string): Record<string, unknown> {
    return decryptJson<Record<string, unknown>>(
      encryptedAuthConfig,
      ENCRYPTION_SECRET
    );
  }

  private mapRow(row: any) {
    return {
      id: row.id,
      accountId: row.account_id,
      name: row.name,
      type: row.type,
      url: row.url,
      authMethod: row.auth_method,
      hasAuthConfig: !!row.encrypted_auth_config,
      config: row.config,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const mcpService = new McpService();
