import { SupabaseClient } from '@supabase/supabase-js';

export interface ServiceClients {
  adminClient: SupabaseClient;
  userClient: SupabaseClient;
}

export interface Subscription {
  id: string;
  user_id: string;
  resource_type: string;
  resource_id: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateSubscriptionPayload {
  resource_type: string;
  resource_id: string;
  is_active?: boolean;
}

export interface SubscriptionScopedService {
  getSubscriptionsByUser(userId: string): Promise<Subscription[]>;
  createSubscription(
    userId: string,
    payload: CreateSubscriptionPayload
  ): Promise<Subscription>;
  deleteSubscription(userId: string, subscriptionId: string): Promise<void>;
  activateSubscription(
    userId: string,
    resourceType: string,
    resourceId: string
  ): Promise<Subscription>;
  deactivateSubscription(
    userId: string,
    resourceType: string,
    resourceId: string
  ): Promise<void>;
}

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

export interface SubscriptionAdminService {
  getSubscriptionById(subscriptionId: string): Promise<Subscription | null>;
  getSubscriptionsByResource(
    resourceType: string,
    resourceId: string
  ): Promise<Subscription[]>;
  getProvidersForResource(
    resourceType: string,
    resourceId: string
  ): Promise<SubscriptionProvider[]>;
}

export interface CreateSubscriptionServiceConfig {}
