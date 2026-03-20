import { SupabaseClient } from '@supabase/supabase-js';
import { adminSupabase } from '../clients/supabase.client';
import { decrypt, encrypt } from './encryption.service.js';

const ENCRYPTION_SECRET = process.env.INTERNAL_API_KEY!;

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

export interface LinkLlmPayload {
  llmId: string;
  secretName?: string;
  secretValue?: string;
  isDefault?: boolean;
}

export interface UpdateLlmLinkPayload {
  secretValue?: string;
  isDefault?: boolean;
}

export interface LinkMcpPayload {
  mcpId: string;
  secretName?: string;
  secretValue?: string;
  secretType?: string;
}

export interface UpdateMcpLinkPayload {
  secretValue?: string;
  isDefault?: boolean;
}

export class AgentConfigService {
  async create(userClient: SupabaseClient, payload: CreateAgentConfigPayload) {
    const { data, error } = await adminSupabase
      .schema('core_automation')
      .from('agents')
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
      .schema('core_automation')
      .from('agents')
      .select('*')
      .eq('user_id', ownerUserId)
      .single();

    if (error || !data) return null;
    return this.mapRow(data);
  }

  async getById(userClient: SupabaseClient, agentId: string) {
    const { data, error } = await userClient
      .schema('core_automation')
      .from('agents')
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
    const updateData: Record<string, unknown> = {};

    if (payload.systemPrompt !== undefined)
      updateData.system_prompt = payload.systemPrompt;
    if (payload.maxConversationHistory !== undefined)
      updateData.max_conversation_history = payload.maxConversationHistory;
    if (payload.skills !== undefined) updateData.skills = payload.skills;
    if (payload.config !== undefined) updateData.config = payload.config;
    if (payload.isActive !== undefined) updateData.is_active = payload.isActive;

    const { data, error } = await adminSupabase
      .schema('core_automation')
      .from('agents')
      .update(updateData)
      .eq('id', agentId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapRow(data);
  }

  async getLlms(userClient: SupabaseClient, agentId: string) {
    const { data, error } = await userClient
      .schema('core_automation')
      .from('agent_llms')
      .select('*, llms(*), secrets(*)')
      .eq('agent_id', agentId);

    if (error) throw new Error(error.message);
    return data || [];
  }

  async linkLlm(
    userClient: SupabaseClient,
    agentId: string,
    payload: LinkLlmPayload
  ) {
    const agent = await this.getAgentById(agentId);
    let secretId: string | null = null;

    if (payload.secretValue) {
      const encrypted = encrypt(payload.secretValue, ENCRYPTION_SECRET);
      const { data, error } = await adminSupabase
        .schema('core_automation')
        .from('secrets')
        .insert({
          account_id: agent.account_id,
          name: payload.secretName || 'LLM API Key',
          secret_type: 'api_key',
          encrypted_value: encrypted,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      secretId = data.id;
    }

    if (payload.isDefault) {
      await adminSupabase
        .schema('core_automation')
        .from('agent_llms')
        .update({ is_default: false })
        .eq('agent_id', agentId);
    }

    const { data, error } = await adminSupabase
      .schema('core_automation')
      .from('agent_llms')
      .insert({
        agent_id: agentId,
        llm_id: payload.llmId,
        secret_id: secretId,
        is_default: payload.isDefault ?? false,
      })
      .select('*, llms(*), secrets(*)')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async unlinkLlm(userClient: SupabaseClient, agentId: string, llmId: string) {
    // Note: the linked secret is intentionally left orphaned (not deleted).
    // Secrets are retained so they can be reused if the LLM is relinked later.
    const { error } = await adminSupabase
      .schema('core_automation')
      .from('agent_llms')
      .delete()
      .eq('agent_id', agentId)
      .eq('llm_id', llmId);

    if (error) throw new Error('Cannot unlink LLM');
    return { success: true };
  }

  async updateLlmLink(
    userClient: SupabaseClient,
    agentId: string,
    llmId: string,
    payload: UpdateLlmLinkPayload
  ) {
    const updateData: Record<string, unknown> = {};

    if (payload.isDefault !== undefined) {
      if (payload.isDefault) {
        await adminSupabase
          .schema('core_automation')
          .from('agent_llms')
          .update({ is_default: false })
          .eq('agent_id', agentId);
      }
      updateData.is_default = payload.isDefault;
    }

    if (payload.secretValue) {
      const { data: existingLink } = await adminSupabase
        .schema('core_automation')
        .from('agent_llms')
        .select('secret_id')
        .eq('agent_id', agentId)
        .eq('llm_id', llmId)
        .single();

      if (existingLink?.secret_id) {
        const encrypted = encrypt(payload.secretValue, ENCRYPTION_SECRET);
        const { error } = await adminSupabase
          .schema('core_automation')
          .from('secrets')
          .update({ encrypted_value: encrypted })
          .eq('id', existingLink.secret_id);

        if (error) throw new Error('Failed to update secret');
      } else {
        const agent = await this.getAgentById(agentId);
        const encrypted = encrypt(payload.secretValue, ENCRYPTION_SECRET);
        const { data, error } = await adminSupabase
          .schema('core_automation')
          .from('secrets')
          .insert({
            account_id: agent.account_id,
            name: 'LLM API Key',
            secret_type: 'api_key',
            encrypted_value: encrypted,
            is_active: true,
          })
          .select()
          .single();

        if (error) throw new Error(error.message);
        updateData.secret_id = data.id;
      }
    }

    const { data, error } = await adminSupabase
      .schema('core_automation')
      .from('agent_llms')
      .update(updateData)
      .eq('agent_id', agentId)
      .eq('llm_id', llmId)
      .select('*, llms(*), secrets(*)')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getMcps(userClient: SupabaseClient, agentId: string) {
    const { data, error } = await userClient
      .schema('core_automation')
      .from('agent_mcps')
      .select('*, mcps(*), secrets(*)')
      .eq('agent_id', agentId);

    if (error) throw new Error(error.message);
    return data || [];
  }

  async linkMcp(
    userClient: SupabaseClient,
    agentId: string,
    payload: LinkMcpPayload
  ) {
    const agent = await this.getAgentById(agentId);
    let secretId: string | null = null;

    if (payload.secretValue) {
      const encrypted = encrypt(payload.secretValue, ENCRYPTION_SECRET);
      const { data, error } = await adminSupabase
        .schema('core_automation')
        .from('secrets')
        .insert({
          account_id: agent.account_id,
          name: payload.secretName || 'MCP Auth Config',
          secret_type: (payload.secretType as any) || 'bearer',
          encrypted_value: encrypted,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      secretId = data.id;
    }

    const { data, error } = await adminSupabase
      .schema('core_automation')
      .from('agent_mcps')
      .insert({
        agent_id: agentId,
        mcp_id: payload.mcpId,
        secret_id: secretId,
      })
      .select('*, mcps(*), secrets(*)')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async unlinkMcp(userClient: SupabaseClient, agentId: string, mcpId: string) {
    // Note: the linked secret is intentionally left orphaned (not deleted).
    // Secrets are retained so they can be reused if the MCP is relinked later.
    const { error } = await adminSupabase
      .schema('core_automation')
      .from('agent_mcps')
      .delete()
      .eq('agent_id', agentId)
      .eq('mcp_id', mcpId);

    if (error) throw new Error('Cannot unlink MCP');
    return { success: true };
  }

  async updateMcpLink(
    userClient: SupabaseClient,
    agentId: string,
    mcpId: string,
    payload: UpdateMcpLinkPayload
  ) {
    const agent = await this.getAgentById(agentId);
    const { data: mcp } = await adminSupabase
      .schema('core_automation')
      .from('mcps')
      .select('account_id')
      .eq('id', mcpId)
      .single();

    if (!mcp || mcp.account_id !== agent.account_id) {
      throw new Error('MCP not found or does not belong to this account');
    }

    const updateData: Record<string, unknown> = {};

    if (payload.isDefault !== undefined) {
      if (payload.isDefault) {
        await adminSupabase
          .schema('core_automation')
          .from('agent_mcps')
          .update({ is_default: false })
          .eq('agent_id', agentId);
      }
      updateData.is_default = payload.isDefault;
    }

    if (payload.secretValue) {
      const { data: existingLink } = await adminSupabase
        .schema('core_automation')
        .from('agent_mcps')
        .select('secret_id')
        .eq('agent_id', agentId)
        .eq('mcp_id', mcpId)
        .single();

      if (existingLink?.secret_id) {
        const encrypted = encrypt(payload.secretValue, ENCRYPTION_SECRET);
        const { error } = await adminSupabase
          .schema('core_automation')
          .from('secrets')
          .update({ encrypted_value: encrypted })
          .eq('id', existingLink.secret_id);

        if (error) throw new Error('Failed to update secret');
      } else {
        const encrypted = encrypt(payload.secretValue, ENCRYPTION_SECRET);
        const { data, error } = await adminSupabase
          .schema('core_automation')
          .from('secrets')
          .insert({
            account_id: agent.account_id,
            name: 'MCP Auth Config',
            secret_type: 'bearer',
            encrypted_value: encrypted,
            is_active: true,
          })
          .select()
          .single();

        if (error) throw new Error(error.message);
        updateData.secret_id = data.id;
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('No update payload provided');
    }

    const { data, error } = await adminSupabase
      .schema('core_automation')
      .from('agent_mcps')
      .update(updateData)
      .eq('agent_id', agentId)
      .eq('mcp_id', mcpId)
      .select('*, mcps(*), secrets(*)')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getAgentSecrets(ownerUserId: string) {
    const secret = process.env.INTERNAL_API_KEY;
    if (!secret) throw new Error('INTERNAL_API_KEY not configured');

    const { data: agent, error } = await adminSupabase
      .schema('core_automation')
      .from('agents')
      .select('id')
      .eq('user_id', ownerUserId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.log(error);
    }

    if (!agent) throw new Error('Agent not found');

    const { data: llmRows } = await adminSupabase
      .schema('core_automation')
      .from('agent_llms')
      .select('*, llms(*), secrets(*)')
      .eq('agent_id', agent.id);

    const llms = (llmRows || []).map((row: any) => {
      const llm = row.llms;
      const secretRow = row.secrets;
      let apiKey: string | null = null;

      if (secretRow?.encrypted_value) {
        try {
          apiKey = decrypt(secretRow.encrypted_value, secret);
        } catch (err) {
          console.warn(
            `Failed to decrypt LLM secret for llm_id=${llm.id}:`,
            err
          );
        }
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
      .schema('core_automation')
      .from('agent_mcps')
      .select('*, mcps(*), secrets(*)')
      .eq('agent_id', agent.id);

    const mcps = (mcpRows || []).map((row: any) => {
      const mcp = row.mcps;
      const secretRow = row.secrets;
      const authMethod = mcp?.auth_method || 'bearer';
      let authSecret: string | null = null;

      if (secretRow?.encrypted_value) {
        try {
          const raw = decrypt(secretRow.encrypted_value, secret);
          try {
            const authConfig = JSON.parse(raw);
            authSecret = authConfig[authMethod] ?? null;
          } catch {
            authSecret = raw;
          }
        } catch (err) {
          console.warn(
            `Failed to decrypt MCP secret for mcp_id=${mcp?.id}:`,
            err
          );
        }
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

  private async getAgentById(agentId: string) {
    const { data, error } = await adminSupabase
      .schema('core_automation')
      .from('agents')
      .select('id, account_id')
      .eq('id', agentId)
      .single();

    if (error || !data) throw new Error('Agent not found');
    return data;
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
