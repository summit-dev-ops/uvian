import { jobService } from '../job.service';
import {
  WebhookEnvelope,
  MessagingEvents,
  MessageCreatedData,
} from '@org/uvian-events';

export function registerChatHandlers(webhookHandler: any) {
  webhookHandler.registerHandler(
    MessagingEvents.MESSAGE_CREATED,
    async (envelope: WebhookEnvelope, agentId?: string) => {
      const payload = envelope.data as MessageCreatedData;

      console.log('Message created:', {
        messageId: payload.messageId,
        content: payload.content,
        conversationId: payload.conversationId,
        source: envelope.source,
        subject: envelope.subject,
        agentId,
      });

      await jobService.createEventJob({
        type: 'agent',
        input: {
          eventId: envelope.id,
          eventType: 'message.created',
          actor: { id: payload.senderId, type: 'user' },
          resource: {
            type: 'message',
            id: payload.messageId,
            data: {
              content: payload.content,
              assetIds: payload.assetIds,
            },
          },
          context: { conversationId: payload.conversationId },
          agentId,
        },
      });
    }
  );
}
