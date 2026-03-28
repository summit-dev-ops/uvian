import { createIdentityScopedService } from './scoped';
import { createIdentityAdminService } from './admin';
import {
  ServiceClients,
  IdentityScopedService,
  IdentityAdminService,
  CreateIdentityServiceConfig,
  UserIdentity,
  CreateIdentityPayload,
} from './types';

export function createIdentityService(_config: CreateIdentityServiceConfig): {
  scoped: (clients: ServiceClients) => IdentityScopedService;
  admin: (clients: ServiceClients) => IdentityAdminService;
} {
  return {
    scoped: (clients: ServiceClients) => createIdentityScopedService(clients),
    admin: (clients: ServiceClients) => createIdentityAdminService(clients),
  };
}

export type {
  ServiceClients,
  IdentityScopedService,
  IdentityAdminService,
  CreateIdentityServiceConfig,
  UserIdentity,
  CreateIdentityPayload,
};
