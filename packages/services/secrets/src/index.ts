import { createSecretsScopedService } from './scoped';
import { createSecretsAdminService } from './admin';
import {
  ServiceClients,
  SecretsScopedService,
  SecretsAdminService,
  CreateSecretsServiceConfig,
  CreateSecretPayload,
  UpdateSecretPayload,
  SecretRecord,
} from './types';

export function createSecretsService(config: CreateSecretsServiceConfig): {
  scoped: (clients: ServiceClients) => SecretsScopedService;
  admin: (clients: ServiceClients) => SecretsAdminService;
} {
  const { encryptionSecret } = config;

  return {
    scoped: (clients: ServiceClients) =>
      createSecretsScopedService(clients, encryptionSecret),
    admin: (clients: ServiceClients) =>
      createSecretsAdminService(clients, encryptionSecret),
  };
}

export type {
  ServiceClients,
  SecretsScopedService,
  SecretsAdminService,
  CreateSecretsServiceConfig,
  CreateSecretPayload,
  UpdateSecretPayload,
  SecretRecord,
};
