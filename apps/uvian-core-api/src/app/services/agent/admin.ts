import { ServiceClients } from '../types/service-clients';
import { AgentAdminService, Agent } from './types';

export function createAgentAdminService(
  clients: ServiceClients
): AgentAdminService {
  return {
    async getAgentById(agentId: string): Promise<Agent | null> {
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

      const { data: member, error: memberError } = await clients.adminClient
        .from('account_members')
        .select('user_id, account_id, created_at')
        .eq('user_id', agentId)
        .limit(1)
        .single();

      if (memberError || !member) {
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
        accountId: member.account_id,
        name:
          (user.user.user_metadata?.name as string) ||
          user.user.email?.split('@')[0] ||
          'Agent',
        email: user.user.email || '',
        createdAt: member.created_at,
      };
    },

    async getAgentsByAccountId(accountId: string): Promise<Agent[]> {
      const { data: members, error: membersError } = await clients.adminClient
        .from('account_members')
        .select('user_id, account_id, created_at')
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

    async getAllAgents(): Promise<Agent[]> {
      const { data: apiKeys, error: keysError } = await clients.adminClient
        .from('agent_api_keys')
        .select('user_id')
        .eq('service', 'core-api')
        .eq('is_active', true);

      if (keysError) {
        throw new Error(`Failed to fetch agent API keys: ${keysError.message}`);
      }

      if (!apiKeys || apiKeys.length === 0) {
        return [];
      }

      const agentUserIds = apiKeys.map((k) => k.user_id);

      const { data: members, error: membersError } = await clients.adminClient
        .from('account_members')
        .select('user_id, account_id, created_at')
        .in('user_id', agentUserIds);

      if (membersError) {
        throw new Error(
          `Failed to fetch account members: ${membersError.message}`
        );
      }

      const { data: users, error: usersError } =
        await clients.adminClient.auth.admin.listUsers();

      if (usersError) {
        throw new Error(`Failed to fetch users: ${usersError.message}`);
      }

      const agents = users.users
        .filter((u) => agentUserIds.includes(u.id))
        .map((u) => {
          const member = members?.find((m) => m.user_id === u.id);
          return {
            id: u.id,
            userId: u.id,
            accountId: member?.account_id || '',
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
  };
}
