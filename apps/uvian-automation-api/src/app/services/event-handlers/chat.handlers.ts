import { queueService } from '../queue.service';
import {
  WebhookEnvelope,
  MessagingEvents,
  MessageCreatedData,
} from '@org/uvian-events';

export function registerChatHandlers(webhookHandler: any) {
  webhookHandler.registerHandler(
    MessagingEvents.MESSAGE_CREATED,
    async (envelope: WebhookEnvelope) => {
      const payload = envelope.data as MessageCreatedData;

      console.log('Message created:', {
        messageId: payload.messageId,
        content: payload.content,
        conversationId: payload.conversationId,
        source: envelope.source,
        subject: envelope.subject,
      });

      await queueService.addJob('main-queue', 'message.created', {
        eventId: envelope.id,
        messageId: payload.messageId,
        content: payload.content,
        assetIds: payload.assetIds,
        conversationId: payload.conversationId,
        senderId: payload.senderId,
      });
    }
  );
}
