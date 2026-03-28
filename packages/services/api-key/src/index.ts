import { createApiKeyScopedService } from './scoped';
import { createApiKeyAdminService } from './admin';
import {
  ServiceClients,
  ApiKeyScopedService,
  ApiKeyAdminService,
  CreateApiKeyServiceConfig,
  ApiKey,
  CreateApiKeyPayload,
} from './types';

export function createApiKeyService(_config: CreateApiKeyServiceConfig): {
  scoped: (clients: ServiceClients) => ApiKeyScopedService;
  admin: (clients: ServiceClients) => ApiKeyAdminService;
} {
  return {
    scoped: (clients: ServiceClients) => createApiKeyScopedService(clients),
    admin: (clients: ServiceClients) => createApiKeyAdminService(clients),
  };
}

export type {
  ServiceClients,
  ApiKeyScopedService,
  ApiKeyAdminService,
  CreateApiKeyServiceConfig,
  ApiKey,
  CreateApiKeyPayload,
};
