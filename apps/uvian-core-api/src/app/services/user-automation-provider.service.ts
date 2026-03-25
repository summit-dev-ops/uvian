import { adminSupabase } from '../clients/supabase.client';
import type { Database } from '../clients/supabase.client';

type UserAutomationProvider =
  Database['public']['Tables']['user_automation_providers']['Row'];

export class UserAutomationProviderService {
  async getProvidersByUser(userId: string): Promise<UserAutomationProvider[]> {
    const { data, error } = await adminSupabase
      .from('user_automation_providers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(
        `Failed to fetch user automation providers: ${error.message}`
      );
    }

    return data || [];
  }

  async getProviderById(
    providerId: string
  ): Promise<UserAutomationProvider | null> {
    const { data, error } = await adminSupabase
      .from('user_automation_providers')
      .select('*')
      .eq('id', providerId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(
        `Failed to fetch user automation provider: ${error.message}`
      );
    }

    return data || null;
  }

  async linkUserToProvider(
    userId: string,
    automationProviderId: string
  ): Promise<UserAutomationProvider> {
    const { data, error } = await adminSupabase
      .from('user_automation_providers')
      .insert({
        user_id: userId,
        automation_provider_id: automationProviderId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to link user to provider: ${error.message}`);
    }

    return data;
  }

  async unlinkUserFromProvider(
    providerLinkId: string,
    userId: string
  ): Promise<void> {
    const { error } = await adminSupabase
      .from('user_automation_providers')
      .delete()
      .eq('id', providerLinkId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to unlink user from provider: ${error.message}`);
    }
  }

  async getProvidersForUser(userId: string): Promise<UserAutomationProvider[]> {
    return this.getProvidersByUser(userId);
  }
}

export const userAutomationProviderService =
  new UserAutomationProviderService();
