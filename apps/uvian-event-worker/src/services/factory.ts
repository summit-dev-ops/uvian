import {
  createSubscriptionService,
  SubscriptionProvider,
} from '@org/services-subscription';
import { withCache } from '@org/utils-cache';
import { supabaseAdmin } from '../clients/supabase';
import { redisConnection } from '../clients/redis';

const SUBSCRIPTION_CACHE_TTL =
  Number(process.env.SUBSCRIPTION_CACHE_TTL) || 300;

const clients = {
  adminClient: supabaseAdmin,
  userClient: supabaseAdmin,
};

const subscriptionService = createSubscriptionService({});
const subscriptionAdmin = subscriptionService.admin(clients);

export const cachedSubscriptionService = withCache(
  subscriptionAdmin,
  redisConnection,
  { ttl: SUBSCRIPTION_CACHE_TTL }
);

export type { SubscriptionProvider };
