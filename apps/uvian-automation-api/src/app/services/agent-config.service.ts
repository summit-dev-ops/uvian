import { SupabaseClient } from '@supabase/supabase-js';
import { adminSupabase } from '../clients/supabase.client';
import { decrypt } from './encryption.service.js';

export interface CreateAgentConfigPayload {
  userId: string;
  accountId: string;
  systemPrompt?: string;
  maxConversationHistory?: number;
  skills?: Record<string, unknown>[];
  config?: Record<string, unknown>;
}

export interface UpdateAgentConfigPayload {
  systemPrompt?: string;
  maxConversationHistory?: number;
  skills?: Record<string, unknown>[];
  config?: Record<string, unknown>;
  isActive?: boolean;
}

export interface AgentLlmsPayload {
  llmIds: string[];
  isDefaultLlmId?: string;
}

export interface AgentMcpsPayload {
  mcpIds: string[];
}

export class AgentConfigService {
  async create(userClient: SupabaseClient, payload: CreateAgentConfigPayload) {
    const { data, error } = await adminSupabase
      .from('core_automation.agents')
      .insert({
        user_id: payload.userId,
        account_id: payload.accountId,
        system_prompt: payload.systemPrompt || null,
        max_conversation_history: payload.maxConversationHistory ?? 50,
        skills: payload.skills || [],
        config: payload.config || {},
        is_active: true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapRow(data);
  }

  async getByUserId(userClient: SupabaseClient, ownerUserId: string) {
    const { data, error } = await adminSupabase
      .from('core_automation.agents')
      .select('*')
      .eq('user_id', ownerUserId)
      .single();

    if (error || !data) return null;
    return this.mapRow(data);
  }

  async getById(userClient: SupabaseClient, agentId: string) {
    const { data, error } = await userClient
      .from('core_automation.agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (error || !data) throw new Error('Agent config not found');
    return this.mapRow(data);
  }

  async update(
    userClient: SupabaseClient,
    agentId: string,
    payload: UpdateAgentConfigPayload
  ) {
    const updateData: any = {};

    if (payload.systemPrompt !== undefined)
      updateData.system_prompt = payload.systemPrompt;
    if (payload.maxConversationHistory !== undefined)
      updateData.max_conversation_history = payload.maxConversationHistory;
    if (payload.skills !== undefined) updateData.skills = payload.skills;
    if (payload.config !== undefined) updateData.config = payload.config;
    if (payload.isActive !== undefined) updateData.is_active = payload.isActive;

    const { data, error } = await adminSupabase
      .from('core_automation.agents')
      .update(updateData)
      .eq('id', agentId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapRow(data);
  }

  async setLlms(
    userClient: SupabaseClient,
    agentId: string,
    payload: AgentLlmsPayload
  ) {
    await adminSupabase
      .from('core_automation.agent_llms')
      .delete()
      .eq('agent_id', agentId);

    if (payload.llmIds.length === 0) return [];

    const rows = payload.llmIds.map((llmId) => ({
      agent_id: agentId,
      llm_id: llmId,
      is_default: llmId === payload.isDefaultLlmId,
    }));

    const { data, error } = await adminSupabase
      .from('core_automation.agent_llms')
      .insert(rows)
      .select();

    if (error) throw new Error(error.message);
    return data;
  }

  async getLlms(userClient: SupabaseClient, agentId: string) {
    const { data, error } = await userClient
      .from('core_automation.agent_llms')
      .select('*, llms(*)')
      .eq('agent_id', agentId);

    if (error) throw new Error(error.message);
    return data || [];
  }

  async setMcps(
    userClient: SupabaseClient,
    agentId: string,
    payload: AgentMcpsPayload
  ) {
    await adminSupabase
      .from('core_automation.agent_mcps')
      .delete()
      .eq('agent_id', agentId);

    if (payload.mcpIds.length === 0) return [];

    const rows = payload.mcpIds.map((mcpId) => ({
      agent_id: agentId,
      mcp_id: mcpId,
    }));

    const { data, error } = await adminSupabase
      .from('core_automation.agent_mcps')
      .insert(rows)
      .select();

    if (error) throw new Error(error.message);
    return data;
  }

  async getMcps(userClient: SupabaseClient, agentId: string) {
    const { data, error } = await userClient
      .from('core_automation.agent_mcps')
      .select('*, mcps(*)')
      .eq('agent_id', agentId);

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getAgentSecrets(ownerUserId: string) {
    const secret = process.env.INTERNAL_API_KEY;
    if (!secret) throw new Error('INTERNAL_API_KEY not configured');

    const { data: agent } = await adminSupabase
      .from('core_automation.agents')
      .select('id')
      .eq('user_id', ownerUserId)
      .eq('is_active', true)
      .single();

    if (!agent) throw new Error('Agent not found');

    const { data: llmRows } = await adminSupabase
      .from('core_automation.agent_llms')
      .select('*, llms(*)')
      .eq('agent_id', agent.id);

    const llms = (llmRows || []).map((row: any) => {
      const llm = row.llms;
      let apiKey: string | null = null;
      if (llm?.encrypted_api_key) {
        try {
          apiKey = decrypt(llm.encrypted_api_key, secret);
        } catch {}
      }
      return {
        id: llm.id,
        name: llm.name,
        type: llm.type,
        model_name: llm.model_name,
        base_url: llm.base_url,
        api_key: apiKey,
        temperature: llm.temperature,
        is_default: row.is_default ?? false,
      };
    });

    const { data: mcpRows } = await adminSupabase
      .from('core_automation.agent_mcps')
      .select('*, mcps(*)')
      .eq('agent_id', agent.id);

    const mcps = (mcpRows || []).map((row: any) => {
      const mcp = row.mcps;
      const authMethod = mcp?.auth_method || 'bearer';
      let authSecret: string | null = null;

      if (mcp?.encrypted_auth_config) {
        try {
          const raw = decrypt(mcp.encrypted_auth_config, secret);
          const authConfig = JSON.parse(raw);
          authSecret = authConfig[authMethod] ?? null;
        } catch {}
      }

      return {
        id: mcp.id,
        name: mcp.name,
        url: mcp.url,
        auth_method: authMethod,
        _auth_secret: authSecret,
      };
    });

    return { llms, mcps };
  }

  private mapRow(row: any) {
    return {
      id: row.id,
      ownerUserId: row.user_id,
      accountId: row.account_id,
      systemPrompt: row.system_prompt,
      maxConversationHistory: row.max_conversation_history,
      skills: row.skills,
      config: row.config,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const agentConfigService = new AgentConfigService();
