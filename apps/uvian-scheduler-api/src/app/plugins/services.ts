import fp from 'fastify-plugin';
import { apiKeyService, accountService, scheduleService } from '../services';

export interface Services {
  schedule: typeof scheduleService;
  apiKey: typeof apiKeyService;
  account: typeof accountService;
}

declare module 'fastify' {
  interface FastifyInstance {
    services: Services;
  }
}

export default fp(async (fastify) => {
  fastify.decorate('services', {
    schedule: scheduleService,
    apiKey: apiKeyService,
    account: accountService,
  });
});
