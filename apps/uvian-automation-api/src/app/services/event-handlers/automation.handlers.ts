import { queueService } from '../queue.service';
import {
  WebhookEnvelope,
  parseSourcePath,
  JobEvents,
  JobCreatedData,
  JobCancelledData,
  JobRetryData,
} from '@org/uvian-events';

export function registerAutomationHandlers(webhookHandler: any) {
  webhookHandler.registerHandler(
    JobEvents.JOB_CREATED,
    async (envelope: WebhookEnvelope) => {
      const payload = envelope.data as JobCreatedData;
      const source = parseSourcePath(envelope.source);

      console.log('Job requested:', {
        jobId: payload.jobId,
        jobType: payload.jobType,
        source: envelope.source,
      });

      await queueService.addJob('main-queue', payload.jobType, {
        eventId: envelope.id,
        jobId: payload.jobId,
        input: payload.inputPayload,
        sourceType: source?.type,
        sourceId: source?.id,
      });
    }
  );

  webhookHandler.registerHandler(
    JobEvents.JOB_CANCELLED,
    async (envelope: WebhookEnvelope) => {
      const payload = envelope.data as JobCancelledData;

      console.log('Job cancelled:', { jobId: payload.jobId });

      await queueService.addJob('main-queue', 'job.cancelled', {
        eventId: envelope.id,
        jobId: payload.jobId,
      });
    }
  );

  webhookHandler.registerHandler(
    JobEvents.JOB_RETRY,
    async (envelope: WebhookEnvelope) => {
      const payload = envelope.data as JobRetryData;

      console.log('Job retry:', { jobId: payload.jobId });

      await queueService.addJob('main-queue', 'job.retry', {
        eventId: envelope.id,
        jobId: payload.jobId,
      });
    }
  );
}
