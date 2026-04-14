import {
  ServiceClients,
  createSecretsService,
  CreateSecretPayload,
} from '@org/services-secrets';
import type { CommandContext } from '../types';

const secretsService = createSecretsService({
  encryptionSecret: process.env.SECRET_INTERNAL_API_KEY!,
});

export interface CreateSecretCommandInput {
  accountId: string;
  name: string;
  valueType: CreateSecretPayload['valueType'];
  value: string;
  metadata?: Record<string, unknown>;
}

export interface CreateSecretCommandOutput {
  secret: { id: string };
}

export async function createSecret(
  clients: ServiceClients,
  input: CreateSecretCommandInput,
  context?: CommandContext,
): Promise<CreateSecretCommandOutput> {
  const secret = await secretsService.scoped(clients).create(input.accountId, {
    name: input.name,
    valueType: input.valueType,
    value: input.value,
    metadata: input.metadata,
  });
  return { secret: { id: secret.id } };
}

export interface DeleteSecretCommandInput {
  accountId: string;
  secretId: string;
}

export interface DeleteSecretCommandOutput {
  success: boolean;
}

export async function deleteSecret(
  clients: ServiceClients,
  input: DeleteSecretCommandInput,
  context?: CommandContext,
): Promise<DeleteSecretCommandOutput> {
  await secretsService.scoped(clients).delete(input.accountId, input.secretId);
  return { success: true };
}
