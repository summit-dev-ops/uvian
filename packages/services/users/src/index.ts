import { createUserScopedService } from './scoped';
import { createUserAdminService } from './admin';
import {
  ServiceClients,
  UserScopedService,
  UserAdminService,
  CreateUserServiceConfig,
  UserSettings,
  User,
  SearchUsersOptions,
} from './types';

export function createUserService(_config: CreateUserServiceConfig): {
  scoped: (clients: ServiceClients) => UserScopedService;
  admin: (clients: ServiceClients) => UserAdminService;
} {
  return {
    scoped: (clients: ServiceClients) => createUserScopedService(clients),
    admin: (clients: ServiceClients) => createUserAdminService(clients),
  };
}

export type {
  ServiceClients,
  UserScopedService,
  UserAdminService,
  CreateUserServiceConfig,
  UserSettings,
  User,
  SearchUsersOptions,
};
