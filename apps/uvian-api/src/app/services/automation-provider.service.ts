import { adminSupabase } from '../clients/supabase.client.js';
import type {
  AutomationProvider,
  CreateAutomationProviderPayload,
  UpdateAutomationProviderPayload,
} from '../types/automation-provider.types.js';

export class AutomationProviderService {
  async getProvidersByAccount(
    accountId: string
  ): Promise<AutomationProvider[]> {
    const { data, error } = await adminSupabase
      .from('automaton_providers')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch providers: ${error.message}`);
    }

    return data || [];
  }

  async getProviderById(
    providerId: string,
    accountId: string
  ): Promise<AutomationProvider | null> {
    const { data, error } = await adminSupabase
      .from('automaton_providers')
      .select('*')
      .eq('id', providerId)
      .eq('account_id', accountId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch provider: ${error.message}`);
    }

    return data || null;
  }

  async getInternalProvider(
    accountId: string
  ): Promise<AutomationProvider | null> {
    const { data, error } = await adminSupabase
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
  }

  async createProvider(
    accountId: string,
    ownerUserId: string,
    payload: CreateAutomationProviderPayload
  ): Promise<AutomationProvider> {
    const { data, error } = await adminSupabase
      .from('automaton_providers')
      .insert({
        account_id: accountId,
        owner_user_id: ownerUserId,
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
  }

  async updateProvider(
    providerId: string,
    accountId: string,
    payload: UpdateAutomationProviderPayload
  ): Promise<AutomationProvider> {
    const updateData: Record<string, any> = {
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

    const { data, error } = await adminSupabase
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
  }

  async deleteProvider(providerId: string, accountId: string): Promise<void> {
    const { error } = await adminSupabase
      .from('automaton_providers')
      .delete()
      .eq('id', providerId)
      .eq('account_id', accountId);

    if (error) {
      throw new Error(`Failed to delete provider: ${error.message}`);
    }
  }
}

export const automationProviderService = new AutomationProviderService();
