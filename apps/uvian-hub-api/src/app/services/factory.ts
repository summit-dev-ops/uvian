import { createApiKeyService } from '@org/services-api-key';
import { createAccountsService } from '@org/services-accounts';
import { createQueueService } from '@org/services-queue';
import { createUserService } from '@org/services-users';
import {
  createProfileService,
} from '@org/services-profiles';
import { redisConnection } from '../clients/redis';

export const apiKeyService = createApiKeyService({});
export const accountService = createAccountsService({});
export const queueService = createQueueService({ redisConnection });
export const userService = createUserService({});
export const profileService = createProfileService({});
