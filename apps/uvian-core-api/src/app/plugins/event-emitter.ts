import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { queueService } from '../services/queue.service';
import { createCloudEvent, CoreEvents } from '@org/uvian-events';
import type {
  AutomationProviderCreatedData,
  AutomationProviderUpdatedData,
  AutomationProviderDeletedData,
  SubscriptionCreatedData,
  SubscriptionDeletedData,
  IdentityCreatedData,
  IdentityUpdatedData,
  IdentityDeletedData,
} from '@org/uvian-events';

const EVENT_QUEUE_NAME = 'uvian-events';

export class EventEmitterService {
  constructor(private fastify: FastifyInstance) {}

  private async emit<T>(
    type: string,
    source: string,
    data: T,
    actorId: string
  ): Promise<void> {
    try {
      const event = createCloudEvent({
        type,
        source,
        subject: actorId,
        data: {
          ...data,
          actorId,
        },
      });
      this.fastify.log.info({ event }, 'Event emitted');

      queueService.addJob(EVENT_QUEUE_NAME, 'event', event).catch((err) => {
        this.fastify.log.error({ err }, 'Failed to add event to queue');
      });
    } catch (error) {
      this.fastify.log.error(
        { err: error, type, source },
        'Failed to emit event'
      );
    }
  }

  emitAutomationProviderCreated(
    data: AutomationProviderCreatedData,
    actorId: string
  ): void {
    this.emit(
      CoreEvents.AUTOMATION_PROVIDER_CREATED,
      '/api/automation-providers',
      data,
      actorId
    );
  }

  emitAutomationProviderUpdated(
    data: AutomationProviderUpdatedData,
    actorId: string
  ): void {
    this.emit(
      CoreEvents.AUTOMATION_PROVIDER_UPDATED,
      '/api/automation-providers',
      data,
      actorId
    );
  }

  emitAutomationProviderDeleted(
    data: AutomationProviderDeletedData,
    actorId: string
  ): void {
    this.emit(
      CoreEvents.AUTOMATION_PROVIDER_DELETED,
      '/api/automation-providers',
      data,
      actorId
    );
  }

  emitSubscriptionCreated(
    data: SubscriptionCreatedData,
    actorId: string
  ): void {
    this.emit(
      CoreEvents.SUBSCRIPTION_CREATED,
      '/api/subscriptions',
      data,
      actorId
    );
  }

  emitSubscriptionDeleted(
    data: SubscriptionDeletedData,
    actorId: string
  ): void {
    this.emit(
      CoreEvents.SUBSCRIPTION_DELETED,
      '/api/subscriptions',
      data,
      actorId
    );
  }

  emitIdentityCreated(data: IdentityCreatedData, actorId: string): void {
    this.emit(CoreEvents.IDENTITY_CREATED, '/api/identities', data, actorId);
  }

  emitIdentityUpdated(data: IdentityUpdatedData, actorId: string): void {
    this.emit(CoreEvents.IDENTITY_UPDATED, '/api/identities', data, actorId);
  }

  emitIdentityDeleted(data: IdentityDeletedData, actorId: string): void {
    this.emit(CoreEvents.IDENTITY_DELETED, '/api/identities', data, actorId);
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const eventEmitter = new EventEmitterService(fastify);
  fastify.decorate('eventEmitter', eventEmitter);
});

declare module 'fastify' {
  interface FastifyInstance {
    eventEmitter: EventEmitterService;
  }
}
