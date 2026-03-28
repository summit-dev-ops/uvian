import { createAgentConfigScopedService } from './scoped';
import { createAgentConfigAdminService } from './admin';
import {
  ServiceClients,
  AgentConfigScopedService,
  AgentConfigAdminService,
  CreateAgentConfigServiceConfig,
} from './types';

export function createAgentConfigService(
  _config: CreateAgentConfigServiceConfig
): {
  scoped: (clients: ServiceClients) => AgentConfigScopedService;
  admin: (clients: ServiceClients) => AgentConfigAdminService;
} {
  return {
    scoped: (clients: ServiceClients) =>
      createAgentConfigScopedService(clients),
    admin: (clients: ServiceClients) => createAgentConfigAdminService(clients),
  };
}

export const agentConfigService = createAgentConfigService({
  encryptionSecret: process.env.SECRET_INTERNAL_API_KEY!,
});

export type {
  ServiceClients,
  AgentConfigScopedService,
  AgentConfigAdminService,
  CreateAgentConfigServiceConfig,
  CreateAgentConfigPayload,
  UpdateAgentConfigPayload,
  LinkLlmPayload,
  UpdateLlmLinkPayload,
  LinkMcpPayload,
  UpdateMcpLinkPayload,
  AgentConfigRecord,
  LinkedLlm,
  LinkedMcp,
  AgentSecrets,
} from './types';
