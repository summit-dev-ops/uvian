import fp from 'fastify-plugin';
import { apiKeyService, accountService, scheduleService } from '../services';

declare module 'fastify' {
  interface FastifyInstance {
    services: {
      schedule: typeof scheduleService;
      apiKey: typeof apiKeyService;
      account: typeof accountService;
      schedulerEmitter: any;
    };
  }
}

export default fp(async (fastify) => {
  fastify.decorate('services', {
    schedule: scheduleService,
    apiKey: apiKeyService,
    account: accountService,
    schedulerEmitter: fastify.schedulerEmitter,
  });
});
