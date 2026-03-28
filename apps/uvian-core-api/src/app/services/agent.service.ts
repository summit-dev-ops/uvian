import crypto from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';

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

export interface ServiceClients {
  adminClient: SupabaseClient;
  userClient: SupabaseClient;
}

export interface CreateAgentServiceConfig {
  apiKeyService: {
    createApiKey: (
      clients: ServiceClients,
      userId: string,
      service: string
    ) => Promise<{ api_key: string }>;
    revokeApiKey: (
      clients: ServiceClients,
      userId: string,
      service: string,
      apiKeyPrefix?: string
    ) => Promise<void>;
  };
}

export interface AgentService {
  getAgents(clients: ServiceClients, accountId: string): Promise<Agent[]>;
  getAgent(
    clients: ServiceClients,
    agentId: string,
    accountId: string
  ): Promise<Agent | null>;
  createAgent(
    clients: ServiceClients,
    userId: string,
    accountId: string,
    name: string
  ): Promise<CreatedAgentResult>;
  deleteAgent(
    clients: ServiceClients,
    userId: string,
    agentId: string,
    accountId: string
  ): Promise<void>;
}

export function createAgentService(
  config: CreateAgentServiceConfig
): AgentService {
  const { apiKeyService } = config;

  return {
    async getAgents(
      clients: ServiceClients,
      accountId: string
    ): Promise<Agent[]> {
      const { data: membership, error: membershipError } =
        await clients.userClient
          .from('account_members')
          .select('account_id')
          .eq('account_id', accountId)
          .limit(1)
          .single();

      if (membershipError || !membership) {
        return [];
      }

      const { data: members, error: membersError } = await clients.userClient
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

      const { data: apiKeys, error: keysError } = await clients.adminClient
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
        await clients.adminClient.auth.admin.listUsers();

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
    },

    async getAgent(
      clients: ServiceClients,
      agentId: string,
      accountId: string
    ): Promise<Agent | null> {
      const { data: member, error: memberError } = await clients.userClient
        .from('account_members')
        .select('user_id, created_at')
        .eq('account_id', accountId)
        .eq('user_id', agentId)
        .single();

      if (memberError || !member) {
        return null;
      }

      const { data: apiKey, error: keyError } = await clients.adminClient
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
        await clients.adminClient.auth.admin.getUserById(agentId);

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
    },

    async createAgent(
      clients: ServiceClients,
      userId: string,
      accountId: string,
      name: string
    ): Promise<CreatedAgentResult> {
      const { data: membership, error: membershipError } =
        await clients.adminClient
          .from('account_members')
          .select('account_id')
          .eq('account_id', accountId)
          .eq('user_id', userId)
          .single();

      if (membershipError || !membership) {
        throw new Error(
          'You must be a member of this account to create agents'
        );
      }

      const agentEmail = `agent-${crypto
        .randomUUID()
        .substring(0, 8)}@uvian.internal`;

      const { data: authData, error: authError } =
        await clients.adminClient.auth.admin.createUser({
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
          `Failed to create agent user: ${
            authError?.message || 'Unknown error'
          }`
        );
      }

      const agentUserId = authData.user.id;

      const { error: memberError } = await clients.adminClient
        .from('account_members')
        .insert({
          account_id: accountId,
          user_id: agentUserId,
          role: { name: 'member', permissions: [] },
        });

      if (memberError) {
        await clients.adminClient.auth.admin.deleteUser(agentUserId);
        throw new Error(
          `Failed to add agent to account: ${memberError.message}`
        );
      }

      const apiKeyResult = await apiKeyService.createApiKey(
        clients,
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
    },

    async deleteAgent(
      clients: ServiceClients,
      userId: string,
      agentId: string,
      accountId: string
    ): Promise<void> {
      const { data: membership, error: membershipError } =
        await clients.adminClient
          .from('account_members')
          .select('account_id')
          .eq('account_id', accountId)
          .eq('user_id', userId)
          .single();

      if (membershipError || !membership) {
        throw new Error(
          'You must be a member of this account to delete agents'
        );
      }

      const agent = await this.getAgent(clients, agentId, accountId);

      if (!agent) {
        throw new Error('Agent not found');
      }

      await apiKeyService.revokeApiKey(clients, agentId, 'core-api');

      const { error: deleteError } = await clients.adminClient
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
        await clients.adminClient.auth.admin.deleteUser(agentId);
      } catch (e) {
        console.error('Failed to delete agent user from auth:', e);
      }
    },
  };
}
