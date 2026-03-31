import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import {
  BaseEventEmitter,
  QueueService,
  Logger,
} from '@org/plugins-event-emitter';
import { createQueueService } from '@org/services-queue';
import { redisConnection } from './cache';
import {
  DiscordEvents,
  DiscordMessageCreatedData,
  DiscordInteractionData,
} from '@org/uvian-events';

const queueService = createQueueService({ redisConnection });

export class DiscordEventEmitter extends BaseEventEmitter {
  emitMessageCreated(
    data: DiscordMessageCreatedData,
    actorId: string,
    source: string
  ): void {
    const resolvedActorId = actorId || 'external';
    this.emit(DiscordEvents.MESSAGE_CREATED, source, data, resolvedActorId);
  }

  emitInteractionReceived(
    data: DiscordInteractionData,
    actorId: string,
    source: string
  ): void {
    const resolvedActorId = actorId || 'external';
    this.emit(
      DiscordEvents.INTERACTION_RECEIVED,
      source,
      data,
      resolvedActorId
    );
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const log: Logger = {
    info: (obj: Record<string, unknown>, msg: string) =>
      fastify.log.info(obj, msg),
    error: (obj: Record<string, unknown>, msg: string) =>
      fastify.log.error(obj, msg),
  };

  const eventEmitter = new DiscordEventEmitter({
    queueService: queueService as unknown as QueueService,
    log,
  });
  fastify.decorate('eventEmitter', eventEmitter);
});

declare module 'fastify' {
  interface FastifyInstance {
    eventEmitter: DiscordEventEmitter;
  }
}
