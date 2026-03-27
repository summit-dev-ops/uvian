import { SupabaseClient } from '@supabase/supabase-js';
import { adminSupabase } from '../clients/supabase.client';
import type { Database } from '../clients/supabase.client';

type Subscription = Database['public']['Tables']['subscriptions']['Row'];

interface CreateSubscriptionPayload {
  resource_type: string;
  resource_id: string;
  is_active?: boolean;
}

export class SubscriptionService {
  async getSubscriptionsByUser(
    userClient: SupabaseClient,
    userId: string
  ): Promise<Subscription[]> {
    const { data, error } = await userClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch subscriptions: ${error.message}`);
    }

    return data || [];
  }

  async getSubscriptionsByResource(
    userClient: SupabaseClient,
    resourceType: string,
    resourceId: string
  ): Promise<Subscription[]> {
    const { data, error } = await userClient
      .from('subscriptions')
      .select('*')
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId);

    if (error) {
      throw new Error(`Failed to fetch subscriptions: ${error.message}`);
    }

    return data || [];
  }

  async getSubscriptionById(
    userClient: SupabaseClient,
    subscriptionId: string
  ): Promise<Subscription | null> {
    const { data, error } = await userClient
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch subscription: ${error.message}`);
    }

    return data || null;
  }

  async createSubscription(
    userClient: SupabaseClient,
    userId: string,
    payload: CreateSubscriptionPayload
  ): Promise<Subscription> {
    const insertData: Record<string, unknown> = {
      user_id: userId,
      resource_type: payload.resource_type,
      resource_id: payload.resource_id,
    };

    if (payload.is_active !== undefined) {
      insertData.is_active = payload.is_active;
    }

    const { data, error } = await adminSupabase
      .from('subscriptions')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }

    return data;
  }

  async deleteSubscription(
    userClient: SupabaseClient,
    userId: string,
    subscriptionId: string
  ): Promise<void> {
    const { data: existing, error: fetchError } = await userClient
      .from('subscriptions')
      .select('id')
      .eq('id', subscriptionId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existing) {
      throw new Error('Subscription not found or access denied');
    }

    const { error } = await adminSupabase
      .from('subscriptions')
      .delete()
      .eq('id', subscriptionId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete subscription: ${error.message}`);
    }
  }

  async deleteSubscriptionByResource(
    userClient: SupabaseClient,
    userId: string,
    resourceType: string,
    resourceId: string
  ): Promise<void> {
    const { error } = await adminSupabase
      .from('subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId);

    if (error) {
      throw new Error(`Failed to delete subscription: ${error.message}`);
    }
  }
}

export const subscriptionService = new SubscriptionService();
