import { createApiKeyService } from '@org/services-api-key';
import { createAccountsService } from '@org/services-accounts';
import { createSecretsService } from '@org/services-secrets';

export const apiKeyService = createApiKeyService({});
export const accountService = createAccountsService({});
export const secretsService = createSecretsService({
  encryptionSecret: process.env.SECRET_INTERNAL_API_KEY!,
});
