import { createHookScopedService } from './scoped';
import { createHookAdminService } from './admin';
import {
  ServiceClients,
  HookScopedService,
  HookAdminService,
  CreateHookServiceConfig,
} from './types';

export function createHookService(_config: CreateHookServiceConfig): {
  scoped: (clients: ServiceClients) => HookScopedService;
  admin: (clients: ServiceClients) => HookAdminService;
} {
  return {
    scoped: (clients: ServiceClients) => createHookScopedService(clients),
    admin: (clients: ServiceClients) => createHookAdminService(clients),
  };
}

export const hookService = createHookService({});

export type {
  ServiceClients,
  HookScopedService,
  HookAdminService,
  CreateHookServiceConfig,
  CreateHookPayload,
  UpdateHookPayload,
  HookRecord,
  ListHooksFilters,
  TriggerJson,
  EffectType,
  AddEffectPayload,
  HookEffect,
} from './types';
