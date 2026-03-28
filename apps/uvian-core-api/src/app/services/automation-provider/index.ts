import { createAutomationProviderScopedService } from './scoped';
import { createAutomationProviderAdminService } from './admin';
import { ServiceClients } from '../types/service-clients';
import {
  CreateAutomationProviderServiceConfig,
  AutomationProviderScopedService,
  AutomationProviderAdminService,
} from './types';

export function createAutomationProviderService(
  _config: CreateAutomationProviderServiceConfig
): {
  scoped: (clients: ServiceClients) => AutomationProviderScopedService;
  admin: (clients: ServiceClients) => AutomationProviderAdminService;
} {
  return {
    scoped: (clients: ServiceClients) =>
      createAutomationProviderScopedService(clients),
    admin: (clients: ServiceClients) =>
      createAutomationProviderAdminService(clients),
  };
}

export type {
  AutomationProviderScopedService,
  AutomationProviderAdminService,
  CreateAutomationProviderServiceConfig,
  AutomationProvider,
  UserAutomationProvider,
  CreateAutomationProviderPayload,
  UpdateAutomationProviderPayload,
} from './types';
