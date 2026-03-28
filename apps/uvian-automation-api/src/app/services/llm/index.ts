import { createLlmScopedService } from './scoped';
import { createLlmAdminService } from './admin';
import {
  ServiceClients,
  LlmScopedService,
  LlmAdminService,
  CreateLlmServiceConfig,
} from './types';

export function createLlmService(_config: CreateLlmServiceConfig): {
  scoped: (clients: ServiceClients) => LlmScopedService;
  admin: (clients: ServiceClients) => LlmAdminService;
} {
  return {
    scoped: (clients: ServiceClients) => createLlmScopedService(clients),
    admin: (clients: ServiceClients) => createLlmAdminService(clients),
  };
}

export const llmService = createLlmService({});

export type {
  ServiceClients,
  LlmScopedService,
  LlmAdminService,
  CreateLlmServiceConfig,
  CreateLlmPayload,
  UpdateLlmPayload,
  LlmRecord,
} from './types';
