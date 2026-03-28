import { SupabaseClient } from '@supabase/supabase-js';
import { decrypt, encrypt } from '@org/utils-encryption';
import {
  ServiceClients,
  AgentConfigScopedService,
  CreateAgentConfigPayload,
  UpdateAgentConfigPayload,
  LinkLlmPayload,
  UpdateLlmLinkPayload,
  LinkMcpPayload,
  UpdateMcpLinkPayload,
  AgentConfigRecord,
  LinkedLlm,
  LinkedMcp,
  AgentSecrets,
} from './types';

const ENCRYPTION_SECRET = process.env.SECRET_INTERNAL_API_KEY!;

export function createAgentConfigScopedService(
  clients: ServiceClients
): AgentConfigScopedService {
  async function getAgentByIdInternal(
    client: SupabaseClient,
    agentId: string
  ): Promise<{ id: string; account_id: string }> {
    const { data, error } = await client
      .schema('core_automation')
      .from('agents')
      .select('id, account_id')
      .eq('id', agentId)
      .single();

    if (error || !data) throw new Error('Agent not found');
    return data;
  }

  return {
    async create(
      payload: CreateAgentConfigPayload
    ): Promise<AgentConfigRecord> {
      const { data, error } = await clients.adminClient
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
      return mapRow(data);
    },

    async getById(agentId: string): Promise<AgentConfigRecord | null> {
      const { data, error } = await clients.userClient
        .schema('core_automation')
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (error || !data) throw new Error('Agent config not found');
      return mapRow(data);
    },

    async getByUserId(ownerUserId: string): Promise<AgentConfigRecord | null> {
      const { data, error } = await clients.adminClient
        .schema('core_automation')
        .from('agents')
        .select('*')
        .eq('user_id', ownerUserId)
        .single();

      if (error || !data) return null;
      return mapRow(data);
    },

    async update(
      agentId: string,
      payload: UpdateAgentConfigPayload
    ): Promise<AgentConfigRecord> {
      const updateData: Record<string, unknown> = {};

      if (payload.systemPrompt !== undefined)
        updateData.system_prompt = payload.systemPrompt;
      if (payload.maxConversationHistory !== undefined)
        updateData.max_conversation_history = payload.maxConversationHistory;
      if (payload.skills !== undefined) updateData.skills = payload.skills;
      if (payload.config !== undefined) updateData.config = payload.config;
      if (payload.isActive !== undefined)
        updateData.is_active = payload.isActive;

      const { data, error } = await clients.adminClient
        .schema('core_automation')
        .from('agents')
        .update(updateData)
        .eq('id', agentId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return mapRow(data);
    },

    async getLlms(agentId: string): Promise<LinkedLlm[]> {
      const { data, error } = await clients.userClient
        .schema('core_automation')
        .from('agent_llms')
        .select('*, llms(*), secrets(*)')
        .eq('agent_id', agentId);

      if (error) throw new Error(error.message);
      return (data || []).map((row: unknown): LinkedLlm => {
        const r = row as Record<string, unknown>;
        const llm = r.llms as Record<string, unknown>;
        const secretRow = r.secrets as Record<string, unknown> | null;
        let apiKey: string | null = null;

        if (secretRow?.encrypted_value) {
          try {
            apiKey = decrypt(
              secretRow.encrypted_value as string,
              ENCRYPTION_SECRET
            );
          } catch (err) {
            console.warn(
              `Failed to decrypt LLM secret for llm_id=${llm.id}:`,
              err
            );
          }
        }

        return {
          id: String(llm.id),
          name: String(llm.name),
          type: String(llm.type),
          model_name: String(llm.model_name),
          base_url: String(llm.base_url),
          api_key: apiKey,
          temperature: Number(llm.temperature),
          is_default: Boolean(r.is_default),
        };
      });
    },

    async linkLlm(agentId: string, payload: LinkLlmPayload): Promise<unknown> {
      const agent = await getAgentByIdInternal(clients.adminClient, agentId);
      let secretId: string | null = null;

      if (payload.secretValue) {
        const encrypted = encrypt(payload.secretValue, ENCRYPTION_SECRET);
        const { data, error } = await clients.adminClient
          .schema('public')
          .from('secrets')
          .insert({
            account_id: agent.account_id,
            name: payload.secretName || 'LLM API Key',
            value_type: 'text',
            encrypted_value: encrypted,
            is_active: true,
          })
          .select()
          .single();

        if (error) throw new Error(error.message);
        secretId = data.id;
      }

      if (payload.isDefault) {
        await clients.adminClient
          .schema('core_automation')
          .from('agent_llms')
          .update({ is_default: false })
          .eq('agent_id', agentId);
      }

      const { data, error } = await clients.adminClient
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
    },

    async unlinkLlm(
      agentId: string,
      llmId: string
    ): Promise<{ success: boolean }> {
      const { error } = await clients.adminClient
        .schema('core_automation')
        .from('agent_llms')
        .delete()
        .eq('agent_id', agentId)
        .eq('llm_id', llmId);

      if (error) throw new Error('Cannot unlink LLM');
      return { success: true };
    },

    async updateLlmLink(
      agentId: string,
      llmId: string,
      payload: UpdateLlmLinkPayload
    ): Promise<unknown> {
      const updateData: Record<string, unknown> = {};

      if (payload.isDefault !== undefined) {
        if (payload.isDefault) {
          await clients.adminClient
            .schema('core_automation')
            .from('agent_llms')
            .update({ is_default: false })
            .eq('agent_id', agentId);
        }
        updateData.is_default = payload.isDefault;
      }

      if (payload.secretValue) {
        const { data: existingLink } = await clients.adminClient
          .schema('core_automation')
          .from('agent_llms')
          .select('secret_id')
          .eq('agent_id', agentId)
          .eq('llm_id', llmId)
          .single();

        if (existingLink?.secret_id) {
          const encrypted = encrypt(payload.secretValue, ENCRYPTION_SECRET);
          const { error } = await clients.adminClient
            .schema('core_automation')
            .from('secrets')
            .update({ encrypted_value: encrypted })
            .eq('id', existingLink.secret_id);

          if (error) throw new Error('Failed to update secret');
        } else {
          const agent = await getAgentByIdInternal(
            clients.adminClient,
            agentId
          );
          const encrypted = encrypt(payload.secretValue, ENCRYPTION_SECRET);
          const { data, error } = await clients.adminClient
            .schema('public')
            .from('secrets')
            .insert({
              account_id: agent.account_id,
              name: 'LLM API Key',
              value_type: 'text',
              encrypted_value: encrypted,
              is_active: true,
            })
            .select()
            .single();

          if (error) throw new Error(error.message);
          updateData.secret_id = data.id;
        }
      }

      const { data, error } = await clients.adminClient
        .schema('core_automation')
        .from('agent_llms')
        .update(updateData)
        .eq('agent_id', agentId)
        .eq('llm_id', llmId)
        .select('*, llms(*), secrets(*)')
        .single();

      if (error) throw new Error(error.message);
      return data;
    },

    async getMcps(agentId: string): Promise<LinkedMcp[]> {
      const { data, error } = await clients.userClient
        .schema('core_automation')
        .from('agent_mcps')
        .select('*, mcps(*), secrets(*)')
        .eq('agent_id', agentId);

      if (error) throw new Error(error.message);
      return (data || []).map((row: unknown): LinkedMcp => {
        const r = row as Record<string, unknown>;
        const mcp = r.mcps as Record<string, unknown>;
        const secretRow = r.secrets as Record<string, unknown> | null;
        const authMethod = String(mcp?.auth_method || 'bearer');
        let authSecret: string | null = null;

        if (secretRow?.encrypted_value) {
          try {
            const raw = decrypt(
              secretRow.encrypted_value as string,
              ENCRYPTION_SECRET
            );
            try {
              const authConfig = JSON.parse(raw);
              authSecret = String(
                (authConfig as Record<string, unknown>)[authMethod] ?? null
              );
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
          id: String(mcp.id),
          name: String(mcp.name),
          url: String(mcp.url),
          auth_method: authMethod,
          _auth_secret: authSecret,
        };
      });
    },

    async linkMcp(agentId: string, payload: LinkMcpPayload): Promise<unknown> {
      const agent = await getAgentByIdInternal(clients.adminClient, agentId);
      let secretId: string | null = null;

      if (payload.secretValue) {
        const encrypted = encrypt(payload.secretValue, ENCRYPTION_SECRET);
        const { data, error } = await clients.adminClient
          .schema('public')
          .from('secrets')
          .insert({
            account_id: agent.account_id,
            name: payload.secretName || 'MCP Auth Config',
            value_type: 'text',
            encrypted_value: encrypted,
            is_active: true,
          })
          .select()
          .single();

        if (error) throw new Error(error.message);
        secretId = data.id;
      }

      const { data, error } = await clients.adminClient
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
    },

    async unlinkMcp(
      agentId: string,
      mcpId: string
    ): Promise<{ success: boolean }> {
      const { error } = await clients.adminClient
        .schema('core_automation')
        .from('agent_mcps')
        .delete()
        .eq('agent_id', agentId)
        .eq('mcp_id', mcpId);

      if (error) throw new Error('Cannot unlink MCP');
      return { success: true };
    },

    async updateMcpLink(
      agentId: string,
      mcpId: string,
      payload: UpdateMcpLinkPayload
    ): Promise<unknown> {
      const agent = await getAgentByIdInternal(clients.adminClient, agentId);
      const { data: mcp } = await clients.adminClient
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
          await clients.adminClient
            .schema('core_automation')
            .from('agent_mcps')
            .update({ is_default: false })
            .eq('agent_id', agentId);
        }
        updateData.is_default = payload.isDefault;
      }

      if (payload.secretValue) {
        const { data: existingLink } = await clients.adminClient
          .schema('core_automation')
          .from('agent_mcps')
          .select('secret_id')
          .eq('agent_id', agentId)
          .eq('mcp_id', mcpId)
          .single();

        if (existingLink?.secret_id) {
          const encrypted = encrypt(payload.secretValue, ENCRYPTION_SECRET);
          const { error } = await clients.adminClient
            .schema('core_automation')
            .from('secrets')
            .update({ encrypted_value: encrypted })
            .eq('id', existingLink.secret_id);

          if (error) throw new Error('Failed to update secret');
        } else {
          const encrypted = encrypt(payload.secretValue, ENCRYPTION_SECRET);
          const { data, error } = await clients.adminClient
            .schema('public')
            .from('secrets')
            .insert({
              account_id: agent.account_id,
              name: 'MCP Auth Config',
              value_type: 'text',
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

      const { data, error } = await clients.adminClient
        .schema('core_automation')
        .from('agent_mcps')
        .update(updateData)
        .eq('agent_id', agentId)
        .eq('mcp_id', mcpId)
        .select('*, mcps(*), secrets(*)')
        .single();

      if (error) throw new Error(error.message);
      return data;
    },

    async getAgentSecrets(ownerUserId: string): Promise<AgentSecrets> {
      const secret = process.env.SECRET_INTERNAL_API_KEY;
      if (!secret) throw new Error('SECRET_INTERNAL_API_KEY not configured');

      const { data: agent, error } = await clients.adminClient
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

      const { data: llmRows } = await clients.adminClient
        .schema('core_automation')
        .from('agent_llms')
        .select('*, llms(*), secrets(*)')
        .eq('agent_id', agent.id);

      const llms = (llmRows || []).map((row: unknown): LinkedLlm => {
        const r = row as Record<string, unknown>;
        const llm = r.llms as Record<string, unknown>;
        const secretRow = r.secrets as Record<string, unknown> | null;
        let apiKey: string | null = null;

        if (secretRow?.encrypted_value) {
          try {
            apiKey = decrypt(secretRow.encrypted_value as string, secret);
          } catch (err) {
            console.warn(
              `Failed to decrypt LLM secret for llm_id=${llm.id}:`,
              err
            );
          }
        }

        return {
          id: String(llm.id),
          name: String(llm.name),
          type: String(llm.type),
          model_name: String(llm.model_name),
          base_url: String(llm.base_url),
          api_key: apiKey,
          temperature: Number(llm.temperature),
          is_default: Boolean(r.is_default),
        };
      });

      const { data: mcpRows } = await clients.adminClient
        .schema('core_automation')
        .from('agent_mcps')
        .select('*, mcps(*), secrets(*)')
        .eq('agent_id', agent.id);

      const mcps = (mcpRows || []).map((row: unknown): LinkedMcp => {
        const r = row as Record<string, unknown>;
        const mcp = r.mcps as Record<string, unknown>;
        const secretRow = r.secrets as Record<string, unknown> | null;
        const authMethod = String(mcp?.auth_method || 'bearer');
        let authSecret: string | null = null;

        if (secretRow?.encrypted_value) {
          try {
            const raw = decrypt(secretRow.encrypted_value as string, secret);
            try {
              const authConfig = JSON.parse(raw);
              authSecret = String(
                (authConfig as Record<string, unknown>)[authMethod] ?? ''
              );
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
          id: String(mcp.id),
          name: String(mcp.name),
          url: String(mcp.url),
          auth_method: authMethod,
          _auth_secret: authSecret,
        };
      });

      return { llms, mcps };
    },
  };
}

function mapRow(row: unknown): AgentConfigRecord {
  const r = row as Record<string, unknown>;
  return {
    id: r.id as string,
    ownerUserId: r.user_id as string,
    accountId: r.account_id as string,
    systemPrompt: r.system_prompt as string | undefined,
    maxConversationHistory: r.max_conversation_history as number,
    skills: r.skills as Record<string, unknown>[],
    config: r.config as Record<string, unknown>,
    isActive: r.is_active as boolean,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}
