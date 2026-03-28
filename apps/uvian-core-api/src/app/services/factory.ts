import { createApiKeyService } from '@org/services-api-key';
import { createAccountsService } from '@org/services-accounts';
import { createQueueService } from '@org/services-queue';
import { createProviderService } from './provider.service';
import { createSubscriptionService } from '@org/services-subscription';
import { createIdentityService } from '@org/services-identity';
import { createUserAutomationProviderService } from './user-automation-provider.service';
import { createAgentService } from './agent.service';
import { createExternalPlatformService } from './external-platform.service';
import { redisConnection } from '../clients/redis';

export const apiKeyService = createApiKeyService({});
export const accountService = createAccountsService({});
export const providerService = createProviderService({});
export const subscriptionService = createSubscriptionService({});
export const identityService = createIdentityService({});
export const userAutomationProviderService =
  createUserAutomationProviderService({});
export const agentService = createAgentService({
  apiKeyService,
});
export const externalPlatformService = createExternalPlatformService({});
export const queueService = createQueueService({ redisConnection });
