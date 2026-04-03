import { createApiKeyService } from '@org/services-api-key';
import { createAccountsService } from '@org/services-accounts';
import { createQueueService } from '@org/services-queue';
import { createSubscriptionService } from '@org/services-subscription';
import { createScheduleService } from './schedule';
import { redisConnection } from '../clients/redis';

export const apiKeyService = createApiKeyService({});
export const accountService = createAccountsService({});
export const queueService = createQueueService({ redisConnection });
export const subscriptionService = createSubscriptionService({});
export const scheduleService = createScheduleService({});
