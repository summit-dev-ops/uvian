import { adminSupabase } from '../clients/supabase.client';
import type { Database } from '../clients/supabase.client';

type Subscription = Database['public']['Tables']['subscriptions']['Row'];
type CreateSubscriptionPayload =
  Database['public']['Tables']['subscriptions']['Insert'];

export class SubscriptionService {
  async getSubscriptionsByUser(userId: string): Promise<Subscription[]> {
    const { data, error } = await adminSupabase
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
    resourceType: string,
    resourceId: string
  ): Promise<Subscription[]> {
    const { data, error } = await adminSupabase
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
    subscriptionId: string
  ): Promise<Subscription | null> {
    const { data, error } = await adminSupabase
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
    userId: string,
    payload: CreateSubscriptionPayload
  ): Promise<Subscription> {
    const { data, error } = await adminSupabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        resource_type: payload.resource_type,
        resource_id: payload.resource_id,
        provider_id: payload.provider_id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }

    return data;
  }

  async deleteSubscription(
    subscriptionId: string,
    userId: string
  ): Promise<void> {
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
