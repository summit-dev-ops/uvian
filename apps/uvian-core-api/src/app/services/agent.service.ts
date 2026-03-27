import crypto from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';
import { adminSupabase } from '../clients/supabase.client';
import { ApiKeyService } from './api-key.service';

export interface Agent {
  id: string;
  userId: string;
  accountId: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface CreatedAgentResult extends Agent {
  apiKey: string;
}

export class AgentService {
  async getAgents(
    userClient: SupabaseClient,
    accountId: string
  ): Promise<Agent[]> {
    const { data: membership, error: membershipError } = await userClient
      .from('account_members')
      .select('account_id')
      .eq('account_id', accountId)
      .limit(1)
      .single();

    if (membershipError || !membership) {
      return [];
    }

    const { data: members, error: membersError } = await userClient
      .from('account_members')
      .select('user_id, created_at')
      .eq('account_id', accountId);

    if (membersError) {
      throw new Error(
        `Failed to fetch account members: ${membersError.message}`
      );
    }

    if (!members || members.length === 0) {
      return [];
    }

    const userIds = members.map((m) => m.user_id);

    const { data: apiKeys, error: keysError } = await adminSupabase
      .from('agent_api_keys')
      .select('user_id')
      .eq('service', 'core-api')
      .in('user_id', userIds)
      .eq('is_active', true);

    if (keysError) {
      throw new Error(`Failed to fetch agent API keys: ${keysError.message}`);
    }

    if (!apiKeys || apiKeys.length === 0) {
      return [];
    }

    const agentUserIds = apiKeys.map((k) => k.user_id);

    const { data: users, error: usersError } =
      await adminSupabase.auth.admin.listUsers();

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    const agents = users.users
      .filter((u) => agentUserIds.includes(u.id))
      .map((u) => {
        const member = members.find((m) => m.user_id === u.id);
        return {
          id: u.id,
          userId: u.id,
          accountId,
          name:
            (u.user_metadata?.name as string) ||
            u.email?.split('@')[0] ||
            'Agent',
          email: u.email || '',
          createdAt: member?.created_at || u.created_at,
        };
      });

    return agents;
  }

  async getAgent(
    userClient: SupabaseClient,
    agentId: string,
    accountId: string
  ): Promise<Agent | null> {
    const { data: member, error: memberError } = await userClient
      .from('account_members')
      .select('user_id, created_at')
      .eq('account_id', accountId)
      .eq('user_id', agentId)
      .single();

    if (memberError || !member) {
      return null;
    }

    const { data: apiKey, error: keyError } = await adminSupabase
      .from('agent_api_keys')
      .select('user_id')
      .eq('service', 'core-api')
      .eq('user_id', agentId)
      .eq('is_active', true)
      .single();

    if (keyError || !apiKey) {
      return null;
    }

    const { data: user, error: userError } =
      await adminSupabase.auth.admin.getUserById(agentId);

    if (userError || !user.user) {
      return null;
    }

    return {
      id: user.user.id,
      userId: user.user.id,
      accountId,
      name:
        (user.user.user_metadata?.name as string) ||
        user.user.email?.split('@')[0] ||
        'Agent',
      email: user.user.email || '',
      createdAt: member.created_at,
    };
  }

  async createAgent(
    userClient: SupabaseClient,
    userId: string,
    accountId: string,
    name: string
  ): Promise<CreatedAgentResult> {
    const { data: membership, error: membershipError } = await userClient
      .from('account_members')
      .select('account_id')
      .eq('account_id', accountId)
      .eq('user_id', userId)
      .single();

    if (membershipError || !membership) {
      throw new Error('You must be a member of this account to create agents');
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
          created_by: userId,
          name,
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

    const apiKeyResult = await ApiKeyService.createApiKey(
      agentUserId,
      'core-api'
    );

    return {
      id: agentUserId,
      userId: agentUserId,
      accountId,
      name,
      email: agentEmail,
      apiKey: apiKeyResult.api_key,
      createdAt: new Date().toISOString(),
    };
  }

  async deleteAgent(
    userClient: SupabaseClient,
    userId: string,
    agentId: string,
    accountId: string
  ): Promise<void> {
    const { data: membership, error: membershipError } = await userClient
      .from('account_members')
      .select('account_id')
      .eq('account_id', accountId)
      .eq('user_id', userId)
      .single();

    if (membershipError || !membership) {
      throw new Error('You must be a member of this account to delete agents');
    }

    const agent = await this.getAgent(userClient, agentId, accountId);

    if (!agent) {
      throw new Error('Agent not found');
    }

    await ApiKeyService.revokeApiKey(agentId, 'core-api');

    const { error: deleteError } = await adminSupabase
      .from('account_members')
      .delete()
      .eq('account_id', accountId)
      .eq('user_id', agentId);

    if (deleteError) {
      throw new Error(
        `Failed to remove agent from account: ${deleteError.message}`
      );
    }

    try {
      await adminSupabase.auth.admin.deleteUser(agentId);
    } catch (e) {
      console.error('Failed to delete agent user from auth:', e);
    }
  }
}

export const agentService = new AgentService();
