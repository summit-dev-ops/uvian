import { redisConnection } from '../clients/redis';
import { WebhookEnvelope, WebhookResponse } from '@org/uvian-events';
import { generateThreadId } from '../utils/thread-id';
import { threadInboxService } from './thread-inbox.service';
import { queueService } from './factory';

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
    agentId?: string
  ): Promise<WebhookResponse> {
    console.log(
      `[webhook] Incoming event: type=${envelope.type}, id=${envelope.id}, source=${envelope.source}, agentId=${agentId}`
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
        envelope.data as Record<string, unknown>
      );
      console.log(
        `[webhook] Generated threadId: ${threadId} for event ${envelope.id}`
      );

      const inboxId = await threadInboxService.insertEvent(
        threadId,
        agentId,
        envelope
      );
      console.log(
        `[webhook] Inserted into thread_inbox: id=${inboxId}, threadId=${threadId}`
      );

      await queueService.addJob(
        'main-queue',
        'thread-wakeup',
        { type: 'thread-wakeup', threadId, agentId },
        { jobId: threadId }
      );
      console.log(`[webhook] Enqueued thread-wakeup job: threadId=${threadId}`);

      return {
        accepted: true,
        event_id: envelope.id,
        message: 'Event queued to thread inbox',
      };
    } catch (error) {
      console.error(
        `[webhook] Error processing event ${envelope.type}:`,
        error
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
