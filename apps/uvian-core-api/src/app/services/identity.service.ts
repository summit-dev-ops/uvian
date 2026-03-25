import { adminSupabase } from '../clients/supabase.client';
import type { Database } from '../clients/supabase.client';

type UserIdentity = Database['public']['Tables']['user_identities']['Row'];
type CreateIdentityPayload =
  Database['public']['Tables']['user_identities']['Insert'];

export class IdentityService {
  async getIdentitiesByUser(userId: string): Promise<UserIdentity[]> {
    const { data, error } = await adminSupabase
      .from('user_identities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch identities: ${error.message}`);
    }

    return data || [];
  }

  async getIdentitiesByProvider(provider: string): Promise<UserIdentity[]> {
    const { data, error } = await adminSupabase
      .from('user_identities')
      .select('*')
      .eq('provider', provider);

    if (error) {
      throw new Error(`Failed to fetch identities: ${error.message}`);
    }

    return data || [];
  }

  async getIdentityById(identityId: string): Promise<UserIdentity | null> {
    const { data, error } = await adminSupabase
      .from('user_identities')
      .select('*')
      .eq('id', identityId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch identity: ${error.message}`);
    }

    return data || null;
  }

  async getIdentityByProviderUserId(
    provider: string,
    providerUserId: string
  ): Promise<UserIdentity | null> {
    const { data, error } = await adminSupabase
      .from('user_identities')
      .select('*')
      .eq('provider', provider)
      .eq('provider_user_id', providerUserId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch identity: ${error.message}`);
    }

    return data || null;
  }

  async createIdentity(
    userId: string,
    payload: CreateIdentityPayload
  ): Promise<UserIdentity> {
    const { data, error } = await adminSupabase
      .from('user_identities')
      .insert({
        user_id: userId,
        provider: payload.provider || 'whatsapp',
        provider_user_id: payload.provider_user_id,
        metadata: payload.metadata || {},
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create identity: ${error.message}`);
    }

    return data;
  }

  async updateIdentity(
    identityId: string,
    userId: string,
    payload: Partial<CreateIdentityPayload>
  ): Promise<UserIdentity> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (payload.provider !== undefined) updateData.provider = payload.provider;
    if (payload.provider_user_id !== undefined)
      updateData.provider_user_id = payload.provider_user_id;
    if (payload.metadata !== undefined) updateData.metadata = payload.metadata;

    const { data, error } = await adminSupabase
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
  }

  async deleteIdentity(identityId: string, userId: string): Promise<void> {
    const { error } = await adminSupabase
      .from('user_identities')
      .delete()
      .eq('id', identityId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete identity: ${error.message}`);
    }
  }
}

export const identityService = new IdentityService();
