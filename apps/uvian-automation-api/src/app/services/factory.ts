import { createApiKeyService } from '@org/services-api-key';
import { createAccountsService } from '@org/services-accounts';
import { createQueueService } from '@org/services-queue';
import { createSecretsService } from '@org/services-secrets';
import { createSubscriptionService } from '@org/services-subscription';
import { redisConnection } from '../clients/redis';

export const apiKeyService = createApiKeyService({});
export const accountService = createAccountsService({});
export const queueService = createQueueService({ redisConnection });
export const secretsService = createSecretsService({
  encryptionSecret: process.env.SECRET_INTERNAL_API_KEY!,
});
export const subscriptionService = createSubscriptionService({});
