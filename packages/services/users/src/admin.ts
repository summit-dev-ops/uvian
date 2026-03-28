import {
  ServiceClients,
  UserAdminService,
  User,
  SearchUsersOptions,
} from './types';

export function createUserAdminService(
  clients: ServiceClients
): UserAdminService {
  return {
    async getUserById(userId: string): Promise<User | null> {
      const { data, error } = await clients.adminClient
        .from('users')
        .select('id, email, raw_user_meta_data')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch user: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        userMetadata: data.raw_user_meta_data,
        isAgent: data.raw_user_meta_data?.is_agent === true,
        name: data.raw_user_meta_data?.name as string | undefined,
      };
    },

    async searchUsers(options?: SearchUsersOptions): Promise<User[]> {
      const limit = options?.limit || 10;

      let query = clients.adminClient
        .from('users')
        .select('id, email, raw_user_meta_data');

      if (options?.includeAgents) {
        query = query.eq('raw_user_meta_data->>is_agent', 'true');
      }

      if (options?.query) {
        query = query.ilike('raw_user_meta_data->>name', `%${options.query}%`);
      }

      const { data, error } = await query.limit(limit);

      if (error) {
        throw new Error(`Failed to search users: ${error.message}`);
      }

      return (data || []).map((user) => ({
        id: user.id,
        email: user.email,
        userMetadata: user.raw_user_meta_data,
        isAgent: user.raw_user_meta_data?.is_agent === true,
        name: user.raw_user_meta_data?.name as string | undefined,
      }));
    },
  };
}
