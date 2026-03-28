import { ServiceClients } from '../types';
import { createAssetScopedService } from './scoped';
import { createAssetAdminService } from './admin';
import {
  AssetScopedService,
  AssetAdminService,
  CreateAssetServiceConfig,
} from './types';

export function createAssetService(_config: CreateAssetServiceConfig): {
  scoped: (clients: ServiceClients) => AssetScopedService;
  admin: (clients: ServiceClients) => AssetAdminService;
} {
  return {
    scoped: (clients: ServiceClients) => createAssetScopedService(clients),
    admin: (clients: ServiceClients) => createAssetAdminService(clients),
  };
}

export type {
  AssetScopedService,
  AssetAdminService,
  Asset,
  CreateAssetInput,
  AssetPagination,
  CreateAssetServiceConfig,
} from './types';
