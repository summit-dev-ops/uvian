import { ServiceClients, IdentityAdminService, UserIdentity } from './types';

export function createIdentityAdminService(
  clients: ServiceClients
): IdentityAdminService {
  return {
    async getIdentityById(identityId: string): Promise<UserIdentity | null> {
      const { data, error } = await clients.adminClient
        .from('user_identities')
        .select('*')
        .eq('id', identityId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch identity: ${error.message}`);
      }

      return data || null;
    },

    async getIdentityByProviderUserId(
      provider: string,
      providerUserId: string
    ): Promise<UserIdentity | null> {
      const { data, error } = await clients.adminClient
        .from('user_identities')
        .select('*')
        .eq('provider', provider)
        .eq('provider_user_id', providerUserId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch identity: ${error.message}`);
      }

      return data || null;
    },

    async getIdentitiesByProvider(provider: string): Promise<UserIdentity[]> {
      const { data, error } = await clients.adminClient
        .from('user_identities')
        .select('*')
        .eq('provider', provider);

      if (error) {
        throw new Error(`Failed to fetch identities: ${error.message}`);
      }

      return data || [];
    },
  };
}
