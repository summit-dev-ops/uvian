import { createSubscriptionScopedService } from './scoped';
import { createSubscriptionAdminService } from './admin';
import {
  ServiceClients,
  SubscriptionScopedService,
  SubscriptionAdminService,
  CreateSubscriptionServiceConfig,
  Subscription,
  CreateSubscriptionPayload,
  SubscriptionProvider,
} from './types';

export function createSubscriptionService(
  _config: CreateSubscriptionServiceConfig
): {
  scoped: (clients: ServiceClients) => SubscriptionScopedService;
  admin: (clients: ServiceClients) => SubscriptionAdminService;
} {
  return {
    scoped: (clients: ServiceClients) =>
      createSubscriptionScopedService(clients),
    admin: (clients: ServiceClients) => createSubscriptionAdminService(clients),
  };
}

export type {
  ServiceClients,
  SubscriptionScopedService,
  SubscriptionAdminService,
  CreateSubscriptionServiceConfig,
  Subscription,
  CreateSubscriptionPayload,
  SubscriptionProvider,
};
