import fp from 'fastify-plugin';
import { BaseEventEmitter } from '@org/plugins-event-emitter';
import { queueService } from '../services/factory';

class SchedulerEventEmitter extends BaseEventEmitter {
  constructor(fastify: any) {
    super({
      queueService,
      log: fastify.log,
    });
  }

  emitEvent<T>(type: string, source: string, data: T, actorId: string): void {
    this.emit(type, source, data, actorId);
  }
}

export default fp(async (fastify) => {
  const emitter = new SchedulerEventEmitter(fastify);
  fastify.decorate('schedulerEmitter', emitter);
});

declare module 'fastify' {
  interface FastifyInstance {
    schedulerEmitter: SchedulerEventEmitter;
  }
}
