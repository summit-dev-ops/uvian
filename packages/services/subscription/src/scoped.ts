import {
  ServiceClients,
  SubscriptionScopedService,
  CreateSubscriptionPayload,
  Subscription,
} from './types';

export function createSubscriptionScopedService(
  clients: ServiceClients
): SubscriptionScopedService {
  return {
    async getSubscriptionsByUser(userId: string): Promise<Subscription[]> {
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

    async createSubscription(
      userId: string,
      payload: CreateSubscriptionPayload
    ): Promise<Subscription> {
      const subscriptionId = `${payload.resource_type.replace(/\./g, '_')}_${
        payload.resource_id
      }`;

      const insertData: Record<string, unknown> = {
        id: subscriptionId,
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

    async activateSubscription(
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

      const subscriptionId = `${resourceType.replace(
        /\./g,
        '_'
      )}_${resourceId}`;

      const { data, error } = await clients.adminClient
        .from('subscriptions')
        .insert({
          id: subscriptionId,
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
