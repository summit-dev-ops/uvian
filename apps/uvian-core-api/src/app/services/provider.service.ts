import { SupabaseClient } from '@supabase/supabase-js';
import { adminSupabase } from '../clients/supabase.client';
import type { Database } from '../clients/supabase.client';

type AutomationProvider =
  Database['public']['Tables']['automaton_providers']['Row'];
type CreateProviderPayload =
  Database['public']['Tables']['automaton_providers']['Insert'];
type UpdateProviderPayload =
  Database['public']['Tables']['automaton_providers']['Insert'];

export class ProviderService {
  async getProvidersByAccount(
    userClient: SupabaseClient,
    accountId: string
  ): Promise<AutomationProvider[]> {
    const { data, error } = await userClient
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
    userClient: SupabaseClient,
    providerId: string,
    accountId: string
  ): Promise<AutomationProvider | null> {
    const { data, error } = await userClient
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
    userClient: SupabaseClient,
    accountId: string
  ): Promise<AutomationProvider | null> {
    const { data, error } = await userClient
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
    userClient: SupabaseClient,
    userId: string,
    accountId: string,
    payload: CreateProviderPayload
  ): Promise<AutomationProvider> {
    const { data: membership, error: membershipError } = await userClient
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

    const { data, error } = await adminSupabase
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
  }

  async updateProvider(
    userClient: SupabaseClient,
    userId: string,
    providerId: string,
    accountId: string,
    payload: Partial<UpdateProviderPayload>
  ): Promise<AutomationProvider> {
    const { data: membership, error: membershipError } = await userClient
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

  async deleteProvider(
    userClient: SupabaseClient,
    userId: string,
    providerId: string,
    accountId: string
  ): Promise<void> {
    const { data: membership, error: membershipError } = await userClient
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

export const providerService = new ProviderService();
