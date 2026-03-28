import { SupabaseClient } from '@supabase/supabase-js';

export interface ServiceClients {
  adminClient: SupabaseClient;
  userClient: SupabaseClient;
}

export interface UserIdentity {
  id: string;
  user_id: string;
  provider: string;
  provider_user_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateIdentityPayload {
  provider?: string;
  provider_user_id?: string;
  metadata?: Record<string, unknown>;
  user_id?: string;
}

export interface IdentityScopedService {
  getIdentitiesByUser(userId: string): Promise<UserIdentity[]>;
  createIdentity(
    userId: string,
    payload: CreateIdentityPayload
  ): Promise<UserIdentity>;
  updateIdentity(
    userId: string,
    identityId: string,
    payload: Partial<CreateIdentityPayload>
  ): Promise<UserIdentity>;
  deleteIdentity(userId: string, identityId: string): Promise<void>;
}

export interface IdentityAdminService {
  getIdentityById(identityId: string): Promise<UserIdentity | null>;
  getIdentityByProviderUserId(
    provider: string,
    providerUserId: string
  ): Promise<UserIdentity | null>;
  getIdentitiesByProvider(provider: string): Promise<UserIdentity[]>;
}

export interface CreateIdentityServiceConfig {}
