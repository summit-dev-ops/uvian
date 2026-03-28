import { createExternalPlatformScopedService } from './scoped';
import { createExternalPlatformAdminService } from './admin';
import { ServiceClients } from '../types/service-clients';
import {
  CreateExternalPlatformServiceConfig,
  ExternalPlatformScopedService,
  ExternalPlatformAdminService,
} from './types';

export function createExternalPlatformService(
  _config: CreateExternalPlatformServiceConfig
): {
  scoped: (clients: ServiceClients) => ExternalPlatformScopedService;
  admin: (clients: ServiceClients) => ExternalPlatformAdminService;
} {
  return {
    scoped: (clients: ServiceClients) =>
      createExternalPlatformScopedService(clients),
    admin: (clients: ServiceClients) =>
      createExternalPlatformAdminService(clients),
  };
}

export type {
  ExternalPlatformScopedService,
  ExternalPlatformAdminService,
  CreateExternalPlatformServiceConfig,
  ExternalPlatform,
  CreatePlatformPayload,
  UpdatePlatformPayload,
} from './types';
