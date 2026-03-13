import { redisConnection } from '../clients/redis';
import { WebhookEnvelope, WebhookResponse } from '@org/uvian-events';

const PROCESSED_EVENTS_TTL = 24 * 60 * 60;

export type EventHandler = (envelope: WebhookEnvelope) => Promise<void>;

export class WebhookHandlerService {
  private handlers: Map<string, EventHandler> = new Map();

  async isEventProcessed(eventId: string): Promise<boolean> {
    const key = `processed_event:${eventId}`;
    const result = await redisConnection.exists(key);
    return result === 1;
  }

  async markEventProcessed(eventId: string): Promise<void> {
    const key = `processed_event:${eventId}`;
    await redisConnection.setex(key, PROCESSED_EVENTS_TTL, '1');
  }

  registerHandler(eventType: string, handler: EventHandler): void {
    this.handlers.set(eventType, handler);
  }

  async handleEvent(envelope: WebhookEnvelope): Promise<WebhookResponse> {
    const alreadyProcessed = await this.isEventProcessed(envelope.id);

    if (alreadyProcessed) {
      return {
        accepted: true,
        event_id: envelope.id,
        message: 'Event already processed',
      };
    }

    await this.markEventProcessed(envelope.id);

    const handler = this.handlers.get(envelope.type);

    if (!handler) {
      console.warn(`No handler registered for event type: ${envelope.type}`);
      return {
        accepted: true,
        event_id: envelope.id,
        message: 'Event received, no handler registered',
      };
    }

    try {
      await handler(envelope);
      return {
        accepted: true,
        event_id: envelope.id,
        message: 'Event processed successfully',
      };
    } catch (error) {
      console.error(`Error processing event ${envelope.type}:`, error);
      return {
        accepted: true,
        event_id: envelope.id,
        message: 'Event received but processing failed',
      };
    }
  }
}

export const webhookHandlerService = new WebhookHandlerService();
