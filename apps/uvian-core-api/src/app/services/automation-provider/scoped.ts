import { ServiceClients } from '../types/service-clients';
import {
  AutomationProviderScopedService,
  CreateAutomationProviderPayload,
  UpdateAutomationProviderPayload,
  AutomationProvider,
  UserAutomationProvider,
} from './types';

export function createAutomationProviderScopedService(
  clients: ServiceClients
): AutomationProviderScopedService {
  return {
    async getProvidersByAccount(
      accountId: string
    ): Promise<AutomationProvider[]> {
      const { data, error } = await clients.userClient
        .from('automaton_providers')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch providers: ${error.message}`);
      }

      return data || [];
    },

    async getProviderById(
      providerId: string,
      accountId: string
    ): Promise<AutomationProvider | null> {
      const { data, error } = await clients.userClient
        .from('automaton_providers')
        .select('*')
        .eq('id', providerId)
        .eq('account_id', accountId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch provider: ${error.message}`);
      }

      return data || null;
    },

    async getInternalProvider(
      accountId: string
    ): Promise<AutomationProvider | null> {
      const { data, error } = await clients.userClient
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

    async createProvider(
      userId: string,
      accountId: string,
      payload: CreateAutomationProviderPayload
    ): Promise<AutomationProvider> {
      const { data: membership, error: membershipError } =
        await clients.adminClient
          .from('account_members')
          .select('account_id')
          .eq('account_id', accountId)
          .eq('user_id', userId)
          .single();

      if (membershipError || !membership) {
        throw new Error(
          'You must be a member of this account to create providers'
        );
      }

      const { data, error } = await clients.adminClient
        .from('automaton_providers')
        .insert({
          account_id: accountId,
          owner_user_id: userId,
          name: payload.name,
          type: payload.type || 'webhook',
          url: payload.url || null,
          auth_method: payload.auth_method || 'none',
          auth_config: payload.auth_config || {},
          is_active: payload.is_active !== undefined ? payload.is_active : true,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create provider: ${error.message}`);
      }

      return data;
    },

    async updateProvider(
      userId: string,
      providerId: string,
      accountId: string,
      payload: Partial<UpdateAutomationProviderPayload>
    ): Promise<AutomationProvider> {
      const { data: membership, error: membershipError } =
        await clients.adminClient
          .from('account_members')
          .select('account_id')
          .eq('account_id', accountId)
          .eq('user_id', userId)
          .single();

      if (membershipError || !membership) {
        throw new Error(
          'You must be a member of this account to update providers'
        );
      }

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (payload.name !== undefined) updateData.name = payload.name;
      if (payload.type !== undefined) updateData.type = payload.type;
      if (payload.url !== undefined) updateData.url = payload.url;
      if (payload.auth_method !== undefined)
        updateData.auth_method = payload.auth_method;
      if (payload.auth_config !== undefined)
        updateData.auth_config = payload.auth_config;
      if (payload.is_active !== undefined)
        updateData.is_active = payload.is_active;

      const { data, error } = await clients.adminClient
        .from('automaton_providers')
        .update(updateData)
        .eq('id', providerId)
        .eq('account_id', accountId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update provider: ${error.message}`);
      }

      return data;
    },

    async deleteProvider(
      userId: string,
      providerId: string,
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
          'You must be a member of this account to delete providers'
        );
      }

      const { error } = await clients.adminClient
        .from('automaton_providers')
        .delete()
        .eq('id', providerId)
        .eq('account_id', accountId);

      if (error) {
        throw new Error(`Failed to delete provider: ${error.message}`);
      }
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

    async unlinkUserFromProvider(
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

    async getUserProviderLinks(
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

    async getUserLinkById(
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

    async getProvidersByUser(
      userId: string
    ): Promise<UserAutomationProvider[]> {
      return this.getUserProviderLinks(userId);
    },
  };
}
