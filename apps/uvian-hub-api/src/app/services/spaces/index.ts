import { ServiceClients } from '../types';
import { createSpacesScopedService } from './scoped';
import { createSpacesAdminService } from './admin';
import {
  SpacesScopedService,
  SpacesAdminService,
  CreateSpacesServiceConfig,
} from './types';

export function createSpacesService(_config: CreateSpacesServiceConfig): {
  scoped: (clients: ServiceClients) => SpacesScopedService;
  admin: (clients: ServiceClients) => SpacesAdminService;
} {
  return {
    scoped: (clients: ServiceClients) => createSpacesScopedService(clients),
    admin: (clients: ServiceClients) => createSpacesAdminService(clients),
  };
}

export type {
  SpacesScopedService,
  SpacesAdminService,
  Space,
  SpaceMember,
  SpaceStats,
  CreateSpaceInput,
  UpdateSpaceInput,
  CreateSpacesServiceConfig,
} from './types';
