import { SupabaseClient } from '@supabase/supabase-js';

export interface Subscription {
  id: string;
  user_id: string;
  resource_type: string;
  resource_id: string;
  is_active: boolean;
  created_at: string;
}

export interface ServiceClients {
  adminClient: SupabaseClient;
  userClient: SupabaseClient;
}

export interface CreateSubscriptionPayload {
  resource_type: string;
  resource_id: string;
  is_active?: boolean;
}

export interface CreateSubscriptionServiceConfig {}

export interface SubscriptionService {
  getSubscriptionsByUser(
    clients: ServiceClients,
    userId: string
  ): Promise<Subscription[]>;
  getSubscriptionsByResource(
    clients: ServiceClients,
    resourceType: string,
    resourceId: string
  ): Promise<Subscription[]>;
  getSubscriptionById(
    clients: ServiceClients,
    subscriptionId: string
  ): Promise<Subscription | null>;
  createSubscription(
    clients: ServiceClients,
    userId: string,
    payload: CreateSubscriptionPayload
  ): Promise<Subscription>;
  deleteSubscription(
    clients: ServiceClients,
    userId: string,
    subscriptionId: string
  ): Promise<void>;
  deleteSubscriptionByResource(
    clients: ServiceClients,
    userId: string,
    resourceType: string,
    resourceId: string
  ): Promise<void>;
  activateSubscription(
    clients: ServiceClients,
    userId: string,
    resourceType: string,
    resourceId: string
  ): Promise<Subscription>;
  deactivateSubscription(
    clients: ServiceClients,
    userId: string,
    resourceType: string,
    resourceId: string
  ): Promise<void>;
}

export function createSubscriptionService(
  _config: CreateSubscriptionServiceConfig
): SubscriptionService {
  return {
    async getSubscriptionsByUser(
      clients: ServiceClients,
      userId: string
    ): Promise<Subscription[]> {
      const { data, error } = await clients.userClient
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch subscriptions: ${error.message}`);
      }

      return data || [];
    },

    async getSubscriptionsByResource(
      clients: ServiceClients,
      resourceType: string,
      resourceId: string
    ): Promise<Subscription[]> {
      const { data, error } = await clients.userClient
        .from('subscriptions')
        .select('*')
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId);

      if (error) {
        throw new Error(`Failed to fetch subscriptions: ${error.message}`);
      }

      return data || [];
    },

    async getSubscriptionById(
      clients: ServiceClients,
      subscriptionId: string
    ): Promise<Subscription | null> {
      const { data, error } = await clients.userClient
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch subscription: ${error.message}`);
      }

      return data || null;
    },

    async createSubscription(
      clients: ServiceClients,
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

      const { data, error } = await clients.adminClient
        .from('subscriptions')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create subscription: ${error.message}`);
      }

      return data;
    },

    async deleteSubscription(
      clients: ServiceClients,
      userId: string,
      subscriptionId: string
    ): Promise<void> {
      const { data: existing, error: fetchError } = await clients.adminClient
        .from('subscriptions')
        .select('id')
        .eq('id', subscriptionId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !existing) {
        throw new Error('Subscription not found or access denied');
      }

      const { error } = await clients.adminClient
        .from('subscriptions')
        .delete()
        .eq('id', subscriptionId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to delete subscription: ${error.message}`);
      }
    },

    async deleteSubscriptionByResource(
      clients: ServiceClients,
      userId: string,
      resourceType: string,
      resourceId: string
    ): Promise<void> {
      const { error } = await clients.adminClient
        .from('subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId);

      if (error) {
        throw new Error(`Failed to delete subscription: ${error.message}`);
      }
    },

    async activateSubscription(
      clients: ServiceClients,
      userId: string,
      resourceType: string,
      resourceId: string
    ): Promise<Subscription> {
      const { data: existing, error: fetchError } = await clients.adminClient
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(`Failed to fetch subscription: ${fetchError.message}`);
      }

      if (existing) {
        const { data, error } = await clients.adminClient
          .from('subscriptions')
          .update({ is_active: true })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to activate subscription: ${error.message}`);
        }

        return data;
      }

      const { data, error } = await clients.adminClient
        .from('subscriptions')
        .insert({
          user_id: userId,
          resource_type: resourceType,
          resource_id: resourceId,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create subscription: ${error.message}`);
      }

      return data;
    },

    async deactivateSubscription(
      clients: ServiceClients,
      userId: string,
      resourceType: string,
      resourceId: string
    ): Promise<void> {
      const { error } = await clients.adminClient
        .from('subscriptions')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId);

      if (error) {
        throw new Error(`Failed to deactivate subscription: ${error.message}`);
      }
    },
  };
}
