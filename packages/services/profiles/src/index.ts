import { createProfileScopedService } from './scoped';
import { createProfileAdminService } from './admin';
import {
  ServiceClients,
  ProfileScopedService,
  ProfileAdminService,
  CreateProfileServiceConfig,
  Profile,
  CreateOrUpdateProfileInput,
} from './types';

export function createProfileService(_config: CreateProfileServiceConfig): {
  scoped: (clients: ServiceClients) => ProfileScopedService;
  admin: (clients: ServiceClients) => ProfileAdminService;
} {
  return {
    scoped: (clients: ServiceClients) => createProfileScopedService(clients),
    admin: (clients: ServiceClients) => createProfileAdminService(clients),
  };
}
export type {
  ServiceClients,
  ProfileScopedService,
  ProfileAdminService,
  CreateProfileServiceConfig,
  Profile,
  CreateOrUpdateProfileInput,
};
