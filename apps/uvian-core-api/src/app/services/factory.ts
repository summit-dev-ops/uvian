import { createApiKeyService } from '@org/services-api-key';
import { createAccountsService } from '@org/services-accounts';
import { createQueueService } from '@org/services-queue';
import { createAutomationProviderService } from './automation-provider';
import { createSubscriptionService } from '@org/services-subscription';
import { createIdentityService } from '@org/services-identity';
import { createAgentService } from './agent';
import { createExternalPlatformService } from './external-platform';
import { redisConnection } from '../clients/redis';

export const apiKeyService = createApiKeyService({});
export const accountService = createAccountsService({});
export const automationProviderService = createAutomationProviderService({});
export const subscriptionService = createSubscriptionService({});
export const identityService = createIdentityService({});
export const agentService = createAgentService({
  apiKeyService,
});
export const externalPlatformService = createExternalPlatformService({});
export const queueService = createQueueService({ redisConnection });
