import { supabaseAdmin } from '../clients/supabase';
import { redisConnection } from '../clients/redis';

const SUBSCRIPTION_PROVIDERS_CACHE_TTL = 300; // 5 minutes

export interface SubscriptionProvider {
  subscription_id: string;
  subscription_is_active: boolean;
  user_id: string;
  resource_type: string;
  resource_id: string;
  dependent_user_id: string;
  provider_id: string;
  provider_name: string;
  type: 'internal' | 'webhook';
  url: string | null;
  auth_method: string;
  auth_config: Record<string, unknown>;
}

export class SubscriptionService {
  private buildCacheKey(resourceType: string, resourceId: string): string {
    return `sub_providers:${resourceType}:${resourceId}`;
  }

  async getProvidersForResource(
    resourceType: string,
    resourceId: string
  ): Promise<SubscriptionProvider[]> {
    const cacheKey = this.buildCacheKey(resourceType, resourceId);

    try {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        console.log(`[SubscriptionService] Cache hit for ${cacheKey}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('[SubscriptionService] Redis cache read error:', error);
    }

    console.log(
      `[SubscriptionService] Cache miss for ${cacheKey}, querying database...`
    );

    const { data, error } = await supabaseAdmin
      .from('get_subscription_providers_for_resource')
      .select('*')
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId);

    if (error) {
      console.error(
        '[SubscriptionService] Error fetching subscription providers:',
        error
      );
      throw error;
    }

    const providers = (data || []) as SubscriptionProvider[];

    try {
      await redisConnection.setex(
        cacheKey,
        SUBSCRIPTION_PROVIDERS_CACHE_TTL,
        JSON.stringify(providers)
      );
      console.log(
        `[SubscriptionService] Cached ${providers.length} providers for ${cacheKey}`
      );
    } catch (error) {
      console.error('[SubscriptionService] Redis cache write error:', error);
    }

    return providers;
  }

  async invalidateCache(
    resourceType: string,
    resourceId: string
  ): Promise<void> {
    const cacheKey = this.buildCacheKey(resourceType, resourceId);
    try {
      await redisConnection.del(cacheKey);
      console.log(`[SubscriptionService] Invalidated cache for ${cacheKey}`);
    } catch (error) {
      console.error(
        '[SubscriptionService] Redis cache invalidation error:',
        error
      );
    }
  }

  async invalidateCacheForProvider(
    automationProviderId: string
  ): Promise<void> {
    try {
      const { data: subscriptions, error } = await supabaseAdmin
        .from('subscriptions')
        .select('resource_type, resource_id')
        .eq('provider_id', automationProviderId);

      if (error) {
        console.error(
          '[SubscriptionService] Error fetching provider subscriptions:',
          error
        );
        return;
      }

      const uniqueKeys = new Set<string>();
      for (const sub of subscriptions || []) {
        uniqueKeys.add(this.buildCacheKey(sub.resource_type, sub.resource_id));
      }

      for (const cacheKey of uniqueKeys) {
        await this.invalidateCacheByKey(cacheKey);
      }

      console.log(
        `[SubscriptionService] Invalidated ${uniqueKeys.size} caches for provider ${automationProviderId}`
      );
    } catch (error) {
      console.error(
        '[SubscriptionService] Error invalidating provider cache:',
        error
      );
    }
  }

  private async invalidateCacheByKey(cacheKey: string): Promise<void> {
    try {
      await redisConnection.del(cacheKey);
      console.log(`[SubscriptionService] Invalidated cache: ${cacheKey}`);
    } catch (error) {
      console.error(
        '[SubscriptionService] Redis cache invalidation error:',
        error
      );
    }
  }
}

export const subscriptionService = new SubscriptionService();
