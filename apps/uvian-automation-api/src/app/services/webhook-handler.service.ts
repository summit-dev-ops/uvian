import { redisConnection } from '../clients/redis';
import { WebhookEnvelope, WebhookResponse } from '@org/uvian-events';
import { generateThreadId } from '../utils/thread-id';
import { threadInboxService } from './thread-inbox.service';
import { queueService } from './factory';
import { adminSupabase } from '../clients/supabase.client';
import { randomUUID } from 'crypto';

const PROCESSED_EVENTS_TTL = 24 * 60 * 60;

export class WebhookHandlerService {
  async isEventProcessed(eventId: string): Promise<boolean> {
    const key = `processed_event:${eventId}`;
    const result = await redisConnection.exists(key);
    return result === 1;
  }

  async markEventProcessed(eventId: string): Promise<void> {
    const key = `processed_event:${eventId}`;
    await redisConnection.setex(key, PROCESSED_EVENTS_TTL, '1');
  }

  async handleEvent(
    envelope: WebhookEnvelope,
    agentId?: string,
  ): Promise<WebhookResponse> {
    console.log(
      `[webhook] Incoming event: type=${envelope.type}, id=${envelope.id}, source=${envelope.source}, agentId=${agentId}`,
    );

    const alreadyProcessed = await this.isEventProcessed(envelope.id);

    if (alreadyProcessed) {
      console.log(`[webhook] Event already processed in Redis: ${envelope.id}`);
      return {
        accepted: true,
        event_id: envelope.id,
        message: 'Event already processed',
      };
    }

    await this.markEventProcessed(envelope.id);
    console.log(`[webhook] Marked event as processed in Redis: ${envelope.id}`);

    if (!agentId) {
      console.warn(`[webhook] No agentId provided for event: ${envelope.type}`);
      return {
        accepted: true,
        event_id: envelope.id,
        message: 'Event received, no agentId provided',
      };
    }

    try {
      const threadId = generateThreadId(
        agentId,
        envelope.type,
        envelope.data as Record<string, unknown>,
      );
      console.log(
        `[webhook] Generated threadId: ${threadId} for event ${envelope.id}`,
      );

      await threadInboxService.insertEvent(threadId, agentId, envelope);
      console.log(
        `[webhook] Inserted into thread_inbox for threadId=${threadId}`,
      );

      const { data: existingJob } = await adminSupabase
        .schema('core_automation')
        .from('jobs')
        .select('id')
        .eq('input->>threadId', threadId)
        .in('status', ['queued', 'pending', 'processing'])
        .maybeSingle();

      if (existingJob) {
        console.log(
          `[webhook] Active job exists for threadId=${threadId}, skipping job creation`,
        );
        return {
          accepted: true,
          event_id: envelope.id,
          message: 'Event queued to existing job',
        };
      }

      const jobId = randomUUID();
      const { data: agent, error: agentError } = await adminSupabase
        .schema('core_automation')
        .from('agents')
        .select('user_id')
        .eq('id', agentId)
        .single();

      if (agentError || !agent?.user_id) {
        console.error(`[webhook] Failed to fetch agent user_id:`, agentError);
        throw new Error('Agent not found or has no user_id');
      }

      const { error: jobError } = await adminSupabase
        .schema('core_automation')
        .from('jobs')
        .insert({
          id: jobId,
          type: 'thread-wakeup',
          input: {
            inputType: 'thread-wakeup',
            threadId,
            agentId,
            agentUserId: agent.user_id,
          },
        });

      if (jobError) {
        console.error(`[webhook] Failed to create job row:`, jobError);
        throw new Error(`Failed to create job: ${jobError.message}`);
      }
      console.log(`[webhook] Created job row: ${jobId}`);

      await queueService.addJob('main-queue', 'thread-wakeup', { jobId });
      console.log(`[webhook] Enqueued job to BullMQ: jobId=${jobId}`);

      return {
        accepted: true,
        event_id: envelope.id,
        message: 'Event queued to thread inbox',
      };
    } catch (error) {
      console.error(
        `[webhook] Error processing event ${envelope.type}:`,
        error,
      );
      return {
        accepted: true,
        event_id: envelope.id,
        message: 'Event received but processing failed',
      };
    }
  }
}

export const webhookHandlerService = new WebhookHandlerService();
