import { ServiceClients } from '../types/service-clients';
import {
  AutomationProviderAdminService,
  AutomationProvider,
  UserAutomationProvider,
} from './types';

export function createAutomationProviderAdminService(
  clients: ServiceClients
): AutomationProviderAdminService {
  return {
    async getProviderById(
      providerId: string
    ): Promise<AutomationProvider | null> {
      const { data, error } = await clients.adminClient
        .from('automaton_providers')
        .select('*')
        .eq('id', providerId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch provider: ${error.message}`);
      }

      return data || null;
    },

    async getProvidersByAccountId(
      accountId: string
    ): Promise<AutomationProvider[]> {
      const { data, error } = await clients.adminClient
        .from('automaton_providers')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch providers: ${error.message}`);
      }

      return data || [];
    },

    async getInternalProviderByAccountId(
      accountId: string
    ): Promise<AutomationProvider | null> {
      const { data, error } = await clients.adminClient
        .from('automaton_providers')
        .select('*')
        .eq('account_id', accountId)
        .eq('type', 'internal')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch internal provider: ${error.message}`);
      }

      return data || null;
    },

    async getProvidersByOwner(userId: string): Promise<AutomationProvider[]> {
      const { data, error } = await clients.adminClient
        .from('automaton_providers')
        .select('*')
        .eq('owner_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch providers: ${error.message}`);
      }

      return data || [];
    },

    async getActiveProviders(): Promise<AutomationProvider[]> {
      const { data, error } = await clients.adminClient
        .from('automaton_providers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch providers: ${error.message}`);
      }

      return data || [];
    },

    async getAllProviders(): Promise<AutomationProvider[]> {
      const { data, error } = await clients.adminClient
        .from('automaton_providers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch providers: ${error.message}`);
      }

      return data || [];
    },

    async linkUserToProvider(
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

    async unlinkUserFromProvider(providerLinkId: string): Promise<void> {
      const { error } = await clients.adminClient
        .from('user_automation_providers')
        .delete()
        .eq('id', providerLinkId);

      if (error) {
        throw new Error(
          `Failed to unlink user from provider: ${error.message}`
        );
      }
    },

    async getAllUserProviderLinks(): Promise<UserAutomationProvider[]> {
      const { data, error } = await clients.adminClient
        .from('user_automation_providers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(
          `Failed to fetch user automation providers: ${error.message}`
        );
      }

      return data || [];
    },

    async getUserProviderLinksByUserId(
      userId: string
    ): Promise<UserAutomationProvider[]> {
      const { data, error } = await clients.adminClient
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
