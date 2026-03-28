import { createMcpScopedService } from './scoped';
import { createMcpAdminService } from './admin';
import {
  ServiceClients,
  McpScopedService,
  McpAdminService,
  CreateMcpServiceConfig,
} from './types';

export function createMcpService(_config: CreateMcpServiceConfig): {
  scoped: (clients: ServiceClients) => McpScopedService;
  admin: (clients: ServiceClients) => McpAdminService;
} {
  return {
    scoped: (clients: ServiceClients) => createMcpScopedService(clients),
    admin: (clients: ServiceClients) => createMcpAdminService(clients),
  };
}

export const mcpService = createMcpService({});

export type {
  ServiceClients,
  McpScopedService,
  McpAdminService,
  CreateMcpServiceConfig,
  CreateMcpPayload,
  UpdateMcpPayload,
  McpRecord,
} from './types';
