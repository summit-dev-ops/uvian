import {
  ServiceClients,
  IdentityScopedService,
  CreateIdentityPayload,
  UserIdentity,
} from './types';

export function createIdentityScopedService(
  clients: ServiceClients
): IdentityScopedService {
  return {
    async getIdentitiesByUser(userId: string): Promise<UserIdentity[]> {
      const { data, error } = await clients.userClient
        .from('user_identities')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch identities: ${error.message}`);
      }

      return data || [];
    },

    async createIdentity(
      userId: string,
      payload: CreateIdentityPayload
    ): Promise<UserIdentity> {
      const { data, error } = await clients.adminClient
        .from('user_identities')
        .insert({
          user_id: userId,
          provider: payload.provider,
          provider_user_id: payload.provider_user_id,
          metadata: payload.metadata || {},
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create identity: ${error.message}`);
      }

      return data;
    },

    async updateIdentity(
      userId: string,
      identityId: string,
      payload: Partial<CreateIdentityPayload>
    ): Promise<UserIdentity> {
      const { data: existing, error: fetchError } = await clients.adminClient
        .from('user_identities')
        .select('id')
        .eq('id', identityId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !existing) {
        throw new Error('Identity not found or access denied');
      }

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (payload.provider !== undefined)
        updateData.provider = payload.provider;
      if (payload.provider_user_id !== undefined)
        updateData.provider_user_id = payload.provider_user_id;
      if (payload.metadata !== undefined)
        updateData.metadata = payload.metadata;

      const { data, error } = await clients.adminClient
        .from('user_identities')
        .update(updateData)
        .eq('id', identityId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update identity: ${error.message}`);
      }

      return data;
    },

    async deleteIdentity(userId: string, identityId: string): Promise<void> {
      const { data: existing, error: fetchError } = await clients.adminClient
        .from('user_identities')
        .select('id')
        .eq('id', identityId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !existing) {
        throw new Error('Identity not found or access denied');
      }

      const { error } = await clients.adminClient
        .from('user_identities')
        .delete()
        .eq('id', identityId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to delete identity: ${error.message}`);
      }
    },
  };
}
