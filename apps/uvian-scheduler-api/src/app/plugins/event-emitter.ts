import fp from 'fastify-plugin';
import { BaseEventEmitter } from '@org/plugins-event-emitter';
import { queueService } from '../services/factory';
import {
  ScheduleEvents,
  ScheduleCreatedData,
  ScheduleUpdatedData,
  ScheduleCancelledData,
} from '@org/uvian-events';

function buildSourcePath(type: string, id: string): string {
  return `/${type}/${id}`;
}

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

  emitScheduleCreated(data: ScheduleCreatedData, actorId: string): void {
    const source = buildSourcePath('schedules', data.scheduleId);
    this.emit(ScheduleEvents.SCHEDULE_CREATED, source, data, actorId);
  }

  emitScheduleUpdated(data: ScheduleUpdatedData, actorId: string): void {
    const source = buildSourcePath('schedules', data.scheduleId);
    this.emit(ScheduleEvents.SCHEDULE_UPDATED, source, data, actorId);
  }

  emitScheduleCancelled(data: ScheduleCancelledData, actorId: string): void {
    const source = buildSourcePath('schedules', data.scheduleId);
    this.emit(ScheduleEvents.SCHEDULE_CANCELLED, source, data, actorId);
  }

  emitScheduleFired(
    type: 'one_time' | 'recurring',
    scheduleId: string,
    eventData: Record<string, unknown>,
    firedAt: string,
  ): void {
    const source = buildSourcePath('schedules', scheduleId);
    this.emit(
      ScheduleEvents.SCHEDULE_FIRED,
      source,
      { scheduleId, type, eventData, firedAt },
      '',
    );
  }

  emitScheduleCompleted(scheduleId: string, completedAt: string): void {
    const source = buildSourcePath('schedules', scheduleId);
    this.emit(
      ScheduleEvents.SCHEDULE_COMPLETED,
      source,
      { scheduleId, completedAt },
      '',
    );
  }

  emitScheduleFailed(
    scheduleId: string,
    error: string,
    retryCount: number,
  ): void {
    const source = buildSourcePath('schedules', scheduleId);
    this.emit(
      ScheduleEvents.SCHEDULE_FAILED,
      source,
      { scheduleId, error, retryCount },
      '',
    );
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
