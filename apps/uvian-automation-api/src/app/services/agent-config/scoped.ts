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
  LinkSkillPayload,
  AgentConfigRecord,
  LinkedLlm,
  LinkedMcp,
  LinkedSkill,
  AgentSecrets,
} from './types';

const ENCRYPTION_SECRET = process.env.SECRET_INTERNAL_API_KEY!;

export function createAgentConfigScopedService(
  clients: ServiceClients,
): AgentConfigScopedService {
  async function getAgentByIdInternal(
    client: SupabaseClient,
    agentId: string,
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
      payload: CreateAgentConfigPayload,
    ): Promise<AgentConfigRecord> {
      const { data, error } = await clients.adminClient
        .schema('core_automation')
        .from('agents')
        .insert({
          user_id: payload.userId,
          account_id: payload.accountId,
          system_prompt: payload.systemPrompt || null,
          max_conversation_history: payload.maxConversationHistory ?? 50,
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
      payload: UpdateAgentConfigPayload,
    ): Promise<AgentConfigRecord> {
      const updateData: Record<string, unknown> = {};

      if (payload.systemPrompt !== undefined)
        updateData.system_prompt = payload.systemPrompt;
      if (payload.maxConversationHistory !== undefined)
        updateData.max_conversation_history = payload.maxConversationHistory;
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

    // ------------------------------------------------------------------------
    // LLM Links (Using Views & RPCs)
    // ------------------------------------------------------------------------

    async getLlms(agentId: string): Promise<LinkedLlm[]> {
      const { data, error } = await clients.userClient
        .schema('core_automation')
        .from('v_agent_llms_with_secrets')
        .select('*')
        .eq('agent_id', agentId);

      if (error) throw new Error(error.message);

      return (data || []).map((row: unknown): LinkedLlm => {
        const r = row as Record<string, unknown>;
        let apiKey: string | null = null;

        if (r.secret_encrypted_value) {
          try {
            apiKey = decrypt(
              r.secret_encrypted_value as string,
              ENCRYPTION_SECRET,
            );
          } catch (err) {
            console.warn(
              `Failed to decrypt LLM secret for llm_id=${r.llm_id}:`,
              err,
            );
          }
        }

        return {
          id: String(r.llm_id),
          name: String(r.llm_name),
          type: String(r.llm_type),
          model_name: String(r.model_name),
          base_url: String(r.base_url),
          api_key: apiKey,
          temperature: Number(r.temperature),
          is_default: Boolean(r.is_default),
        };
      });
    },

    async linkLlm(agentId: string, payload: LinkLlmPayload): Promise<unknown> {
      const agent = await getAgentByIdInternal(clients.adminClient, agentId);

      let encryptedSecret: string | null = null;
      if (payload.secretValue) {
        encryptedSecret = encrypt(payload.secretValue, ENCRYPTION_SECRET);
      }

      const { error } = await clients.adminClient
        .schema('core_automation')
        .rpc('link_agent_llm', {
          p_agent_id: agentId,
          p_llm_id: payload.llmId,
          p_account_id: agent.account_id,
          p_is_default: payload.isDefault ?? false,
          p_secret_name: payload.secretName || 'LLM API Key',
          p_encrypted_secret: encryptedSecret,
        });

      if (error) throw new Error(error.message);

      // Fetch the newly created link from the view to return consistent data
      const { data } = await clients.adminClient
        .schema('core_automation')
        .from('v_agent_llms_with_secrets')
        .select('*')
        .eq('agent_id', agentId)
        .eq('llm_id', payload.llmId)
        .single();

      return data;
    },

    async unlinkLlm(
      agentId: string,
      llmId: string,
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
      payload: UpdateLlmLinkPayload,
    ): Promise<unknown> {
      if (payload.isDefault === undefined && !payload.secretValue) {
        throw new Error('No update payload provided');
      }

      const agent = await getAgentByIdInternal(clients.adminClient, agentId);

      let encryptedSecret: string | null = null;
      if (payload.secretValue) {
        encryptedSecret = encrypt(payload.secretValue, ENCRYPTION_SECRET);
      }

      const { error } = await clients.adminClient
        .schema('core_automation')
        .rpc('update_agent_llm_link', {
          p_agent_id: agentId,
          p_llm_id: llmId,
          p_account_id: agent.account_id,
          p_is_default: payload.isDefault ?? null,
          p_encrypted_secret: encryptedSecret,
        });

      if (error) throw new Error(error.message);

      const { data } = await clients.adminClient
        .schema('core_automation')
        .from('v_agent_llms_with_secrets')
        .select('*')
        .eq('agent_id', agentId)
        .eq('llm_id', llmId)
        .single();

      return data;
    },

    // ------------------------------------------------------------------------
    // MCP Links (Using Views & RPCs)
    // ------------------------------------------------------------------------

    async getMcps(agentId: string): Promise<LinkedMcp[]> {
      const { data, error } = await clients.userClient
        .schema('core_automation')
        .from('v_agent_mcps_with_secrets')
        .select('*')
        .eq('agent_id', agentId);

      if (error) throw new Error(error.message);

      return (data || []).map((row: unknown): LinkedMcp => {
        const r = row as Record<string, unknown>;
        const authMethod = String(r.auth_method || 'bearer');
        let authSecret: string | null = null;

        if (r.secret_encrypted_value) {
          try {
            const raw = decrypt(
              r.secret_encrypted_value as string,
              ENCRYPTION_SECRET,
            );
            try {
              const authConfig = JSON.parse(raw);
              authSecret = String(
                (authConfig as Record<string, unknown>)[authMethod] ?? null,
              );
            } catch {
              authSecret = raw;
            }
          } catch (err) {
            console.warn(
              `Failed to decrypt MCP secret for mcp_id=${r.mcp_id}:`,
              err,
            );
          }
        }

        return {
          id: String(r.mcp_id),
          name: String(r.mcp_name),
          url: String(r.mcp_url),
          auth_method: authMethod,
          _auth_secret: authSecret,
          usage_guidance: (r.mcp_usage_guidance as string) || undefined,
          autoLoadEvents: (r.mcp_auto_load_events as string[]) || [],
          is_default: (r.is_default as boolean) || false,
        };
      });
    },

    async linkMcp(agentId: string, payload: LinkMcpPayload): Promise<unknown> {
      const agent = await getAgentByIdInternal(clients.adminClient, agentId);

      let encryptedSecret: string | null = null;
      if (payload.secretValue) {
        encryptedSecret = encrypt(payload.secretValue, ENCRYPTION_SECRET);
      }

      const { error } = await clients.adminClient
        .schema('core_automation')
        .rpc('link_agent_mcp', {
          p_agent_id: agentId,
          p_mcp_id: payload.mcpId,
          p_account_id: agent.account_id,
          p_secret_name: payload.secretName || 'MCP Auth Config',
          p_encrypted_secret: encryptedSecret,
        });

      if (error) throw new Error(error.message);

      const { data } = await clients.adminClient
        .schema('core_automation')
        .from('v_agent_mcps_with_secrets')
        .select('*')
        .eq('agent_id', agentId)
        .eq('mcp_id', payload.mcpId)
        .single();

      return data;
    },

    async unlinkMcp(
      agentId: string,
      mcpId: string,
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
      payload: UpdateMcpLinkPayload,
    ): Promise<unknown> {
      if (payload.isDefault === undefined && !payload.secretValue) {
        throw new Error('No update payload provided');
      }

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

      let encryptedSecret: string | null = null;
      if (payload.secretValue) {
        encryptedSecret = encrypt(payload.secretValue, ENCRYPTION_SECRET);
      }

      const { error } = await clients.adminClient
        .schema('core_automation')
        .rpc('update_agent_mcp_link', {
          p_agent_id: agentId,
          p_mcp_id: mcpId,
          p_account_id: agent.account_id,
          p_is_default: payload.isDefault ?? null,
          p_encrypted_secret: encryptedSecret,
        });

      if (error) throw new Error(error.message);

      const { data } = await clients.adminClient
        .schema('core_automation')
        .from('v_agent_mcps_with_secrets')
        .select('*')
        .eq('agent_id', agentId)
        .eq('mcp_id', mcpId)
        .single();

      return data;
    },

    // ------------------------------------------------------------------------
    // Skill Links
    // ------------------------------------------------------------------------

    async getSkills(agentId: string): Promise<LinkedSkill[]> {
      const { data, error } = await clients.userClient
        .schema('core_automation')
        .from('v_agent_skills')
        .select('*')
        .eq('agent_id', agentId);

      if (error) throw new Error(error.message);

      return (data || []).map((row: unknown): LinkedSkill => {
        const r = row as Record<string, unknown>;
        return {
          id: String(r.skill_id),
          name: String(r.name),
          description: String(r.description),
          content: (r.content as Record<string, unknown>) || {},
          autoLoadEvents: (r.auto_load_events as string[]) || [],
          isPrivate: Boolean(r.is_private),
          linkConfig: (r.link_config as Record<string, unknown>) || {},
        };
      });
    },

    async linkSkill(
      agentId: string,
      payload: LinkSkillPayload,
    ): Promise<unknown> {
      const agent = await getAgentByIdInternal(clients.adminClient, agentId);

      const { data: skill } = await clients.adminClient
        .schema('core_automation')
        .from('skills')
        .select('id, account_id, is_private')
        .eq('id', payload.skillId)
        .single();

      if (!skill) throw new Error('Skill not found');

      if (skill.is_private && skill.account_id !== agent.account_id) {
        throw new Error('Cannot link private skill from another account');
      }

      const { error } = await clients.adminClient
        .schema('core_automation')
        .from('agent_skills')
        .insert({
          agent_id: agentId,
          skill_id: payload.skillId,
        });

      if (error) throw new Error(error.message);

      const { data } = await clients.adminClient
        .schema('core_automation')
        .from('v_agent_skills')
        .select('*')
        .eq('agent_id', agentId)
        .eq('skill_id', payload.skillId)
        .single();

      return data;
    },

    async unlinkSkill(
      agentId: string,
      skillId: string,
    ): Promise<{ success: boolean }> {
      const { error } = await clients.adminClient
        .schema('core_automation')
        .from('agent_skills')
        .delete()
        .eq('agent_id', agentId)
        .eq('skill_id', skillId);

      if (error) throw new Error('Cannot unlink skill');
      return { success: true };
    },

    // ------------------------------------------------------------------------
    // Consolidated Secrets Retrieval
    // ------------------------------------------------------------------------

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

      if (error) console.log(error);
      if (!agent) throw new Error('Agent not found');

      // Fetch from the combined views
      const [llmsRes, mcpsRes] = await Promise.all([
        clients.adminClient
          .schema('core_automation')
          .from('v_agent_llms_with_secrets')
          .select('*')
          .eq('agent_id', agent.id),
        clients.adminClient
          .schema('core_automation')
          .from('v_agent_mcps_with_secrets')
          .select('*')
          .eq('agent_id', agent.id),
      ]);

      const llms = (llmsRes.data || []).map((row: unknown): LinkedLlm => {
        const r = row as Record<string, unknown>;
        let apiKey: string | null = null;

        if (r.secret_encrypted_value) {
          try {
            apiKey = decrypt(r.secret_encrypted_value as string, secret);
          } catch (err) {
            console.warn(
              `Failed to decrypt LLM secret for llm_id=${r.llm_id}:`,
              err,
            );
          }
        }

        return {
          id: String(r.llm_id),
          name: String(r.llm_name),
          type: String(r.llm_type),
          model_name: String(r.model_name),
          base_url: String(r.base_url),
          api_key: apiKey,
          temperature: Number(r.temperature),
          is_default: Boolean(r.is_default),
          config: (r.config as Record<string, unknown>) || {},
        };
      });

      const mcps = (mcpsRes.data || []).map((row: unknown): LinkedMcp => {
        const r = row as Record<string, unknown>;
        const authMethod = String(r.auth_method || 'bearer');
        let authSecret: string | null = null;

        if (r.secret_encrypted_value) {
          try {
            const raw = decrypt(r.secret_encrypted_value as string, secret);
            try {
              const authConfig = JSON.parse(raw);
              authSecret = String(
                (authConfig as Record<string, unknown>)[authMethod] ?? '',
              );
            } catch {
              authSecret = raw;
            }
          } catch (err) {
            console.warn(
              `Failed to decrypt MCP secret for mcp_id=${r.mcp_id}:`,
              err,
            );
          }
        }

        return {
          id: String(r.mcp_id),
          name: String(r.mcp_name),
          url: String(r.mcp_url),
          auth_method: authMethod,
          _auth_secret: authSecret,
          usage_guidance: (r.mcp_usage_guidance as string) || undefined,
          autoLoadEvents: (r.mcp_auto_load_events as string[]) || [],
          is_default: (r.is_default as boolean) || false,
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
    config: r.config as Record<string, unknown>,
    isActive: r.is_active as boolean,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}
