import { createAgentScopedService } from './scoped';
import { createAgentAdminService } from './admin';
import { ServiceClients } from '../types/service-clients';
import {
  CreateAgentServiceConfig,
  AgentScopedService,
  AgentAdminService,
} from './types';

export function createAgentService(config: CreateAgentServiceConfig): {
  scoped: (clients: ServiceClients) => AgentScopedService;
  admin: (clients: ServiceClients) => AgentAdminService;
} {
  return {
    scoped: (clients: ServiceClients) =>
      createAgentScopedService(clients, config),
    admin: (clients: ServiceClients) => createAgentAdminService(clients),
  };
}

export type {
  Agent,
  CreatedAgentResult,
  AgentScopedService,
  AgentAdminService,
  CreateAgentServiceConfig,
} from './types';
