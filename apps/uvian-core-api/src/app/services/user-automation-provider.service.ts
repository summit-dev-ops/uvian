import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../clients/supabase.client';

type UserAutomationProvider =
  Database['public']['Tables']['user_automation_providers']['Row'];

export interface ServiceClients {
  adminClient: SupabaseClient;
  userClient: SupabaseClient;
}

export interface CreateUserAutomationProviderServiceConfig {}

export interface UserAutomationProviderService {
  getProvidersByUser(
    clients: ServiceClients,
    userId: string
  ): Promise<UserAutomationProvider[]>;
  getProviderById(
    clients: ServiceClients,
    providerId: string
  ): Promise<UserAutomationProvider | null>;
  linkUserToProvider(
    clients: ServiceClients,
    userId: string,
    automationProviderId: string
  ): Promise<UserAutomationProvider>;
  unlinkUserFromProvider(
    clients: ServiceClients,
    userId: string,
    providerLinkId: string
  ): Promise<void>;
  getProvidersForUser(
    clients: ServiceClients,
    userId: string
  ): Promise<UserAutomationProvider[]>;
}

export function createUserAutomationProviderService(
  _config: CreateUserAutomationProviderServiceConfig
): UserAutomationProviderService {
  return {
    async getProvidersByUser(
      clients: ServiceClients,
      userId: string
    ): Promise<UserAutomationProvider[]> {
      const { data, error } = await clients.userClient
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
    },

    async getProviderById(
      clients: ServiceClients,
      providerId: string
    ): Promise<UserAutomationProvider | null> {
      const { data, error } = await clients.userClient
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
    },

    async linkUserToProvider(
      clients: ServiceClients,
      userId: string,
      automationProviderId: string
    ): Promise<UserAutomationProvider> {
      const { data, error } = await clients.adminClient
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
    },

    async unlinkUserFromProvider(
      clients: ServiceClients,
      userId: string,
      providerLinkId: string
    ): Promise<void> {
      const { data: existing, error: fetchError } = await clients.adminClient
        .from('user_automation_providers')
        .select('id')
        .eq('id', providerLinkId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !existing) {
        throw new Error('Provider link not found or access denied');
      }

      const { error } = await clients.adminClient
        .from('user_automation_providers')
        .delete()
        .eq('id', providerLinkId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(
          `Failed to unlink user from provider: ${error.message}`
        );
      }
    },

    async getProvidersForUser(
      clients: ServiceClients,
      userId: string
    ): Promise<UserAutomationProvider[]> {
      const { data, error } = await clients.userClient
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
    },
  };
}
