import { createAccountsScopedService } from './scoped';
import { createAccountsAdminService } from './admin';
import {
  ServiceClients,
  AccountsScopedService,
  AccountsAdminService,
  CreateAccountsServiceConfig,
} from './types';

export function createAccountsService(_config: CreateAccountsServiceConfig): {
  scoped: (clients: ServiceClients) => AccountsScopedService;
  admin: (clients: ServiceClients) => AccountsAdminService;
} {
  return {
    scoped: (clients: ServiceClients) => createAccountsScopedService(clients),
    admin: (clients: ServiceClients) => createAccountsAdminService(clients),
  };
}

export type {
  ServiceClients,
  Account,
  AccountMember,
  CreateAccountPayload,
  UpdateAccountPayload,
  AccountsScopedService,
  AccountsAdminService,
  CreateAccountsServiceConfig,
} from './types';
