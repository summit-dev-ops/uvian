import { createIdentityService } from '@org/services-identity';
import { createSubscriptionService } from '@org/services-subscription';
import { createUserService } from '@org/services-users';
import { createApiKeyService } from '@org/services-api-key';
import { adminSupabase } from '../clients/supabase.client';

const clients = {
  adminClient: adminSupabase,
  userClient: adminSupabase,
};

export const identityService = createIdentityService({});
export const subscriptionService = createSubscriptionService({});
export const userService = createUserService({});
export const apiKeyService = createApiKeyService({});

export { clients };
