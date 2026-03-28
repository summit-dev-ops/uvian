import {
  ServiceClients,
  SubscriptionAdminService,
  Subscription,
  SubscriptionProvider,
} from './types';

export function createSubscriptionAdminService(
  clients: ServiceClients
): SubscriptionAdminService {
  return {
    async getSubscriptionById(
      subscriptionId: string
    ): Promise<Subscription | null> {
      const { data, error } = await clients.adminClient
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch subscription: ${error.message}`);
      }

      return data || null;
    },

    async getSubscriptionsByResource(
      resourceType: string,
      resourceId: string
    ): Promise<Subscription[]> {
      const { data, error } = await clients.adminClient
        .from('subscriptions')
        .select('*')
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId);

      if (error) {
        throw new Error(`Failed to fetch subscriptions: ${error.message}`);
      }

      return data || [];
    },

    async getProvidersForResource(
      resourceType: string,
      resourceId: string
    ): Promise<SubscriptionProvider[]> {
      const { data, error } = await clients.adminClient
        .from('get_subscription_providers_for_resource')
        .select('*')
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId);

      if (error) {
        throw new Error(
          `Failed to fetch subscription providers: ${error.message}`
        );
      }

      return (data || []) as SubscriptionProvider[];
    },
  };
}
