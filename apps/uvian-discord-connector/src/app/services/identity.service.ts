import { adminSupabase } from '../clients/supabase.client';

type UserIdentity = {
  id: string;
  user_id: string;
  provider: string;
  provider_user_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export class IdentityService {
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
}

export const identityService = new IdentityService();
