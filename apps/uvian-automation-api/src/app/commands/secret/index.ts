import {
  ServiceClients,
  createSecretsService,
  CreateSecretPayload,
} from '@org/services-secrets';
import type { CommandContext } from '../types';
import { getUserIdFromClient, getAccountIdFromUserId } from '../account-utils';

const secretsService = createSecretsService({
  encryptionSecret: process.env.SECRET_INTERNAL_API_KEY!,
});

export interface CreateSecretCommandInput {
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
  const userId = await getUserIdFromClient(clients);
  const accountId = await getAccountIdFromUserId(clients, userId);

  const secret = await secretsService.scoped(clients).create(accountId, {
    name: input.name,
    valueType: input.valueType,
    value: input.value,
    metadata: input.metadata,
  });
  return { secret: { id: secret.id } };
}

export interface DeleteSecretCommandInput {
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
  const userId = await getUserIdFromClient(clients);
  const accountId = await getAccountIdFromUserId(clients, userId);

  await secretsService.scoped(clients).delete(accountId, input.secretId);
  return { success: true };
}