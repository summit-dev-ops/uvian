import {
  ServiceClients,
  LlmScopedService,
  CreateLlmPayload,
  UpdateLlmPayload,
  LlmRecord,
} from './types';

export function createLlmScopedService(
  clients: ServiceClients
): LlmScopedService {
  return {
    async list(accountId: string): Promise<LlmRecord[]> {
      const { data, error } = await clients.userClient
        .schema('core_automation')
        .from('llms')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data || []).map((row: unknown) => mapRow(row));
    },

    async get(llmId: string): Promise<LlmRecord | null> {
      const { data, error } = await clients.userClient
        .schema('core_automation')
        .from('llms')
        .select('*')
        .eq('id', llmId)
        .single();

      if (error || !data) throw new Error('LLM not found');
      return mapRow(data);
    },

    async create(
      accountId: string,
      payload: CreateLlmPayload,
    ): Promise<LlmRecord> {
      const { data, error } = await clients.adminClient
        .schema('core_automation')
        .from('llms')
        .insert({
          account_id: accountId,
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
      return mapRow(data);
    },

    async update(llmId: string, payload: UpdateLlmPayload): Promise<LlmRecord> {
      const updateData: Record<string, unknown> = {};

      if (payload.name !== undefined) updateData.name = payload.name;
      if (payload.type !== undefined) updateData.type = payload.type;
      if (payload.provider !== undefined)
        updateData.provider = payload.provider;
      if (payload.modelName !== undefined)
        updateData.model_name = payload.modelName;
      if (payload.baseUrl !== undefined) updateData.base_url = payload.baseUrl;
      if (payload.temperature !== undefined)
        updateData.temperature = payload.temperature;
      if (payload.maxTokens !== undefined)
        updateData.max_tokens = payload.maxTokens;
      if (payload.config !== undefined) updateData.config = payload.config;
      if (payload.isActive !== undefined)
        updateData.is_active = payload.isActive;
      if (payload.isDefault !== undefined)
        updateData.is_default = payload.isDefault;

      const { data, error } = await clients.adminClient
        .schema('core_automation')
        .from('llms')
        .update(updateData)
        .eq('id', llmId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return mapRow(data);
    },

    async delete(llmId: string): Promise<{ success: boolean }> {
      const { error } = await clients.adminClient
        .schema('core_automation')
        .from('llms')
        .delete()
        .eq('id', llmId);

      if (error) throw new Error('Cannot delete LLM');
      return { success: true };
    },
  };
}

function mapRow(row: unknown): LlmRecord {
  const r = row as Record<string, unknown>;
  return {
    id: r.id as string,
    accountId: r.account_id as string,
    name: r.name as string,
    type: r.type as string,
    provider: r.provider as string,
    modelName: r.model_name as string,
    baseUrl: r.base_url as string | undefined,
    temperature: r.temperature as number,
    maxTokens: r.max_tokens as number,
    config: r.config as Record<string, unknown>,
    isActive: r.is_active as boolean,
    isDefault: r.is_default as boolean,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}
