import { createApiKeyService } from '@org/services-api-key';
import { createAccountsService } from '@org/services-accounts';
import { createSecretsService } from '@org/services-secrets';
import { createSubscriptionService } from '@org/services-subscription';
import { createIntakeService } from './intake';

export const apiKeyService = createApiKeyService({});
export const accountService = createAccountsService({});
export const secretsService = createSecretsService({
  encryptionSecret: process.env.SECRET_INTERNAL_API_KEY!,
});
export const intakeService = createIntakeService({});
export const subscriptionService = createSubscriptionService({});
