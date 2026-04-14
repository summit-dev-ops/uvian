import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import {
  BaseEventEmitter,
  QueueService,
  Logger,
} from '@org/plugins-event-emitter';
import { queueService } from '../services';
import { CoreEvents } from '@org/uvian-events';
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

export class CoreEventEmitter extends BaseEventEmitter {
  emitAutomationProviderCreated(
    data: AutomationProviderCreatedData,
    actorId: string,
  ): void {
    this.emit(
      CoreEvents.AUTOMATION_PROVIDER_CREATED,
      '/api/automation-providers',
      data,
      actorId,
    );
  }

  emitAutomationProviderUpdated(
    data: AutomationProviderUpdatedData,
    actorId: string,
  ): void {
    this.emit(
      CoreEvents.AUTOMATION_PROVIDER_UPDATED,
      '/api/automation-providers',
      data,
      actorId,
    );
  }

  emitAutomationProviderDeleted(
    data: AutomationProviderDeletedData,
    actorId: string,
  ): void {
    this.emit(
      CoreEvents.AUTOMATION_PROVIDER_DELETED,
      '/api/automation-providers',
      data,
      actorId,
    );
  }

  emitSubscriptionCreated(
    data: SubscriptionCreatedData,
    actorId: string,
  ): void {
    this.emit(
      CoreEvents.SUBSCRIPTION_CREATED,
      '/api/subscriptions',
      data,
      actorId,
    );
  }

  emitSubscriptionDeleted(
    data: SubscriptionDeletedData,
    actorId: string,
  ): void {
    this.emit(
      CoreEvents.SUBSCRIPTION_DELETED,
      '/api/subscriptions',
      data,
      actorId,
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
  const log: Logger = {
    info: (obj, msg) => fastify.log.info(obj, msg),
    error: (obj, msg) => fastify.log.error(obj, msg),
  };

  const eventEmitter = new CoreEventEmitter({
    queueService: queueService as unknown as QueueService,
    log,
  });
  fastify.decorate('eventEmitter', eventEmitter);
});

declare module 'fastify' {
  interface FastifyInstance {
    eventEmitter: CoreEventEmitter;
  }
}
