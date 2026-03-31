import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import {
  BaseEventEmitter,
  QueueService,
  Logger,
} from '@org/plugins-event-emitter';
import {
  IntakeEvents,
  IntakeCreatedData,
  IntakeCompletedData,
  IntakeRevokedData,
} from '@org/uvian-events';

class IntakeEventEmitter extends BaseEventEmitter {
  emitIntakeCreated(data: IntakeCreatedData): void {
    this.emit(
      IntakeEvents.INTAKE_CREATED,
      `/intakes/${data.intakeId}`,
      data,
      data.createdBy
    );
  }

  emitIntakeCompleted(data: IntakeCompletedData): void {
    this.emit(
      IntakeEvents.INTAKE_COMPLETED,
      `/intakes/${data.intakeId}`,
      data,
      data.createdBy
    );
  }

  emitIntakeRevoked(data: IntakeRevokedData): void {
    this.emit(
      IntakeEvents.INTAKE_REVOKED,
      `/intakes/${data.intakeId}`,
      data,
      data.revokedBy
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

  const eventEmitter = new IntakeEventEmitter({
    queueService: fastify.queueService as unknown as QueueService,
    log,
  });
  fastify.decorate('eventEmitter', eventEmitter);
});

declare module 'fastify' {
  interface FastifyInstance {
    eventEmitter: IntakeEventEmitter;
  }
}
