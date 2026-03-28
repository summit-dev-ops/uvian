import { adminSupabase } from '../../clients/supabase.client';
import { jobService } from '../job.service';
import {
  WebhookEnvelope,
  parseSourcePath,
  JobEvents,
  JobCreatedData,
  JobCancelledData,
  JobRetryData,
} from '@org/uvian-events';

export function registerAutomationHandlers(webhookHandler: any) {
  const clients = { adminClient: adminSupabase, userClient: adminSupabase };

  webhookHandler.registerHandler(
    JobEvents.JOB_CREATED,
    async (envelope: WebhookEnvelope, agentId?: string) => {
      const payload = envelope.data as JobCreatedData;
      const source = parseSourcePath(envelope.source);

      console.log('Job requested:', {
        jobId: payload.jobId,
        jobType: payload.jobType,
        source: envelope.source,
        agentId,
      });

      await jobService.createEventJob(clients, {
        type: 'agent',
        input: {
          eventId: envelope.id,
          eventType: 'job.created',
          actor: { id: source?.id || 'system', type: source?.type || 'system' },
          resource: {
            type: 'job',
            id: payload.jobId,
            data: {
              jobType: payload.jobType,
              inputPayload: payload.inputPayload,
            },
          },
          context: {},
          agentId,
        },
      });
    }
  );

  webhookHandler.registerHandler(
    JobEvents.JOB_CANCELLED,
    async (envelope: WebhookEnvelope, agentId?: string) => {
      const payload = envelope.data as JobCancelledData;

      console.log('Job cancelled:', { jobId: payload.jobId, agentId });

      await jobService.createEventJob(clients, {
        type: 'agent',
        input: {
          eventId: envelope.id,
          eventType: 'job.cancelled',
          actor: { id: 'system', type: 'system' },
          resource: {
            type: 'job',
            id: payload.jobId,
            data: {},
          },
          context: {},
          agentId,
        },
      });
    }
  );

  webhookHandler.registerHandler(
    JobEvents.JOB_RETRY,
    async (envelope: WebhookEnvelope, agentId?: string) => {
      const payload = envelope.data as JobRetryData;

      console.log('Job retry:', { jobId: payload.jobId, agentId });

      await jobService.createEventJob(clients, {
        type: 'agent',
        input: {
          eventId: envelope.id,
          eventType: 'job.retry',
          actor: { id: 'system', type: 'system' },
          resource: {
            type: 'job',
            id: payload.jobId,
            data: {},
          },
          context: {},
          agentId,
        },
      });
    }
  );
}
