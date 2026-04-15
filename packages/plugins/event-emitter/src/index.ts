import { createCloudEvent } from '@org/uvian-events';

const DEFAULT_QUEUE_NAME = 'uvian-events';

export interface QueueService {
  addJob(queueName: string, jobName: string, data: unknown): Promise<unknown>;
}

export interface Logger {
  info: (obj: Record<string, unknown>, msg: string) => void;
  error: (obj: Record<string, unknown>, msg: string) => void;
}

export interface BaseEventEmitterConfig {
  queueService: QueueService;
  log: Logger;
  queueName?: string;
}

export class BaseEventEmitter {
  private queueName: string;

  constructor(private config: BaseEventEmitterConfig) {
    this.queueName = config.queueName ?? DEFAULT_QUEUE_NAME;
  }

  protected emit<T>(
    type: string,
    source: string,
    data: T,
    actorId: string,
  ): void {
    try {
      const eventData = {
        ...data,
        actorId: actorId || undefined,
      };
      const event = createCloudEvent({
        type,
        source,
        data: eventData,
      });
      this.config.log.info({ event }, 'Event emitted');

      this.config.queueService
        .addJob(this.queueName, 'event', event)
        .catch((err) => {
          this.config.log.error({ err }, 'Failed to add event to queue');
        });
    } catch (error) {
      this.config.log.error(
        { err: error, type, source },
        'Failed to emit event',
      );
    }
  }
}
