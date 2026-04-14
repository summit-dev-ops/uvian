import fp from 'fastify-plugin';
import {
  automationProviderService,
  subscriptionService,
  identityService,
  agentService,
  externalPlatformService,
} from '../services';
import type { CoreEventEmitter } from './event-emitter.js';

export interface Services {
  automationProvider: typeof automationProviderService;
  subscription: typeof subscriptionService;
  identity: typeof identityService;
  agent: typeof agentService;
  externalPlatform: typeof externalPlatformService;
  eventEmitter: CoreEventEmitter;
}

declare module 'fastify' {
  interface FastifyInstance {
    services: Services;
  }
}

export default fp(async (fastify) => {
  fastify.decorate('services', {
    automationProvider: automationProviderService,
    subscription: subscriptionService,
    identity: identityService,
    agent: agentService,
    externalPlatform: externalPlatformService,
    eventEmitter: fastify.eventEmitter,
  });
});
