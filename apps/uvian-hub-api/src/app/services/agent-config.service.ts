import { adminSupabase } from '../clients/supabase.client.js';
import { automationProviderService } from './automation-provider.service.js';
import { ApiKeyService } from './api-key.service.js';
import type {
  AgentConfig,
  CreateAgentConfigPayload,
  UpdateAgentConfigPayload,
} from '../types/agent-config.types.js';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface CreatedAgentResult extends AgentConfig {
  api_key: string;
}

export class AgentConfigService {
  async getAgentsByAccount(
    userClient: SupabaseClient,
    accountId: string
  ): Promise<AgentConfig[]> {
    const { data, error } = await userClient
      .schema('core_hub')
      .from('get_my_agent_configs')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch agents: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      agent_user_id: row.agent_user_id,
      account_id: row.account_id,
      automation_provider_id: row.automation_provider_id,
      name: row.name,
      description: row.description,
      subscribed_events: row.subscribed_events,
      config: row.config,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
      agent_display_name: row.agent_display_name || null,
      agent_avatar_url: row.agent_avatar_url || null,
    }));
  }

  async getAgentById(
    userClient: SupabaseClient,
    agentId: string,
    accountId: string
  ): Promise<AgentConfig | null> {
    const { data, error } = await userClient
      .schema('core_hub')
      .from('get_my_agent_configs')
      .select('*')
      .eq('id', agentId)
      .eq('account_id', accountId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch agent: ${error.message}`);
    }

    if (!data) return null;

    return {
      id: data.id,
      agent_user_id: data.agent_user_id,
      account_id: data.account_id,
      automation_provider_id: data.automation_provider_id,
      name: data.name,
      description: data.description,
      subscribed_events: data.subscribed_events,
      config: data.config,
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,
      agent_display_name: data.agent_display_name || null,
      agent_avatar_url: data.agent_avatar_url || null,
    };
  }

  async createAgent(
    accountId: string,
    creatorUserId: string,
    payload: CreateAgentConfigPayload
  ): Promise<CreatedAgentResult> {
    const internalProvider =
      await automationProviderService.getInternalProvider(accountId);

    if (!internalProvider) {
      throw new Error('No internal provider found for this account');
    }

    const agentEmail = `agent-${crypto
      .randomUUID()
      .substring(0, 8)}@uvian.internal`;

    const { data: authData, error: authError } =
      await adminSupabase.auth.admin.createUser({
        email: agentEmail,
        email_confirm: true,
        user_metadata: {
          is_agent: true,
          created_by: creatorUserId,
          name: payload.name,
        },
      });

    if (authError || !authData.user) {
      throw new Error(
        `Failed to create agent user: ${authError?.message || 'Unknown error'}`
      );
    }

    const agentUserId = authData.user.id;

    const { error: memberError } = await adminSupabase
      .from('account_members')
      .insert({
        account_id: accountId,
        user_id: agentUserId,
        role: { name: 'member', permissions: [] },
      });

    if (memberError) {
      await adminSupabase.auth.admin.deleteUser(agentUserId);
      throw new Error(`Failed to add agent to account: ${memberError.message}`);
    }

    const { data, error } = await adminSupabase
      .schema('core_hub')
      .from('agent_configs')
      .insert({
        agent_user_id: agentUserId,
        account_id: accountId,
        automation_provider_id: internalProvider.id,
        name: payload.name,
        description: payload.description || null,
        subscribed_events: payload.subscribed_events || [],
        config: payload.config || {},
        is_active: payload.is_active !== undefined ? payload.is_active : true,
      })
      .select()
      .single();

    if (error) {
      await adminSupabase.auth.admin.deleteUser(agentUserId);
      throw new Error(`Failed to create agent config: ${error.message}`);
    }

    const apiKeyResult = await ApiKeyService.createApiKey(
      agentUserId,
      'hub-api'
    );

    await this.initAgentInAutomationApi(
      agentUserId,
      accountId,
      apiKeyResult.api_key,
      apiKeyResult.api_key.substring(0, 16)
    );

    return {
      ...data,
      agent_display_name: payload.name,
      agent_avatar_url: null,
      api_key: apiKeyResult.api_key,
    };
  }

  private async initAgentInAutomationApi(
    agentUserId: string,
    accountId: string,
    apiKey: string,
    apiKeyPrefix: string
  ): Promise<void> {
    const automationApiUrl = process.env.UVIAN_AUTOMATION_API_URL;
    const internalApiKey = process.env.UVIAN_AUTOMATION_API_KEY;

    if (!automationApiUrl || !internalApiKey) {
      throw new Error('Automation API configuration not found');
    }

    const response = await fetch(`${automationApiUrl}/api/agents/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${internalApiKey}`,
      },
      body: JSON.stringify({
        user_id: agentUserId,
        account_id: accountId,
        api_key: apiKey,
        api_key_prefix: apiKeyPrefix,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to initialize agent in automation API: ${response.status} ${errorText}`
      );
    }
  }

  async updateAgent(
    agentId: string,
    accountId: string,
    payload: UpdateAgentConfigPayload
  ): Promise<AgentConfig> {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.description !== undefined)
      updateData.description = payload.description;
    if (payload.subscribed_events !== undefined)
      updateData.subscribed_events = payload.subscribed_events;
    if (payload.config !== undefined) updateData.config = payload.config;
    if (payload.is_active !== undefined)
      updateData.is_active = payload.is_active;

    const { data, error } = await adminSupabase
      .schema('core_hub')
      .from('agent_configs')
      .update(updateData)
      .eq('id', agentId)
      .eq('account_id', accountId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update agent: ${error.message}`);
    }

    return {
      ...data,
      agent_display_name: data.name,
      agent_avatar_url: null,
    };
  }

  async deleteAgent(agentId: string, accountId: string): Promise<void> {
    const agent = await this.getAgentById(adminSupabase, agentId, accountId);

    if (!agent) {
      throw new Error('Agent not found');
    }

    const { error } = await adminSupabase
      .schema('core_hub')
      .from('agent_configs')
      .delete()
      .eq('id', agentId)
      .eq('account_id', accountId);

    if (error) {
      throw new Error(`Failed to delete agent config: ${error.message}`);
    }

    try {
      await adminSupabase.auth.admin.deleteUser(agent.agent_user_id);
    } catch (e) {
      console.error('Failed to delete agent user from auth:', e);
    }
  }

  async deactivateAgent(
    agentId: string,
    accountId: string
  ): Promise<AgentConfig> {
    return this.updateAgent(agentId, accountId, { is_active: false });
  }
}

export const agentConfigService = new AgentConfigService();
