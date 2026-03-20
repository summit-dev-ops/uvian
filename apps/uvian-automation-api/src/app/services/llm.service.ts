import { SupabaseClient } from '@supabase/supabase-js';
import { adminSupabase } from '../clients/supabase.client';

export interface CreateLlmPayload {
  accountId: string;
  name: string;
  type: string;
  provider: string;
  modelName: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  config?: Record<string, unknown>;
  isDefault?: boolean;
}

export interface UpdateLlmPayload {
  name?: string;
  type?: string;
  provider?: string;
  modelName?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  config?: Record<string, unknown>;
  isActive?: boolean;
  isDefault?: boolean;
}

export class LlmService {
  async create(userClient: SupabaseClient, payload: CreateLlmPayload) {
    const { data, error } = await adminSupabase
      .schema('core_automation')
      .from('llms')
      .insert({
        account_id: payload.accountId,
        name: payload.name,
        type: payload.type,
        provider: payload.provider,
        model_name: payload.modelName,
        base_url: payload.baseUrl || null,
        temperature: payload.temperature ?? 0.6,
        max_tokens: payload.maxTokens ?? 4096,
        config: payload.config || {},
        is_default: payload.isDefault ?? false,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapRow(data);
  }

  async list(userClient: SupabaseClient, accountId: string) {
    const { data, error } = await userClient
      .schema('core_automation')
      .from('llms')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map((row: any) => this.mapRow(row));
  }

  async get(userClient: SupabaseClient, llmId: string) {
    const { data, error } = await userClient
      .schema('core_automation')
      .from('llms')
      .select('*')
      .eq('id', llmId)
      .single();

    if (error || !data) throw new Error('LLM not found');
    return this.mapRow(data);
  }

  async update(
    userClient: SupabaseClient,
    llmId: string,
    payload: UpdateLlmPayload
  ) {
    const updateData: Record<string, unknown> = {};

    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.type !== undefined) updateData.type = payload.type;
    if (payload.provider !== undefined) updateData.provider = payload.provider;
    if (payload.modelName !== undefined)
      updateData.model_name = payload.modelName;
    if (payload.baseUrl !== undefined) updateData.base_url = payload.baseUrl;
    if (payload.temperature !== undefined)
      updateData.temperature = payload.temperature;
    if (payload.maxTokens !== undefined)
      updateData.max_tokens = payload.maxTokens;
    if (payload.config !== undefined) updateData.config = payload.config;
    if (payload.isActive !== undefined) updateData.is_active = payload.isActive;
    if (payload.isDefault !== undefined)
      updateData.is_default = payload.isDefault;

    const { data, error } = await adminSupabase
      .schema('core_automation')
      .from('llms')
      .update(updateData)
      .eq('id', llmId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapRow(data);
  }

  async delete(userClient: SupabaseClient, llmId: string) {
    const { error } = await adminSupabase
      .schema('core_automation')
      .from('llms')
      .delete()
      .eq('id', llmId);

    if (error) throw new Error('Cannot delete LLM');
    return { success: true };
  }

  private mapRow(row: any) {
    return {
      id: row.id,
      accountId: row.account_id,
      name: row.name,
      type: row.type,
      provider: row.provider,
      modelName: row.model_name,
      baseUrl: row.base_url,
      temperature: row.temperature,
      maxTokens: row.max_tokens,
      config: row.config,
      isActive: row.is_active,
      isDefault: row.is_default,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const llmService = new LlmService();
