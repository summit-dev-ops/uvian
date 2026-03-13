import { queueService } from '../queue.service';
import {
  WebhookEnvelope,
  MessagingEvents,
  ConversationMemberJoinedData,
  MessageCreatedData,
} from '@org/uvian-events';

export function registerConversationEventHandlers() {
  return [
    {
      eventType: MessagingEvents.MESSAGE_CREATED,
      handler: async (envelope: WebhookEnvelope) => {
        const payload = envelope.data as MessageCreatedData;

        console.log('Conversation message event received:', {
          eventId: envelope.id,
          conversationId: payload.conversationId,
          source: envelope.source,
        });

        await queueService.addJob('main-queue', 'message.created', {
          eventId: envelope.id,
          messageId: payload.messageId,
          content: payload.content,
          conversationId: payload.conversationId,
          senderId: payload.senderId,
        });
      },
    },
    {
      eventType: MessagingEvents.CONVERSATION_MEMBER_JOINED,
      handler: async (envelope: WebhookEnvelope) => {
        const payload = envelope.data as ConversationMemberJoinedData;

        console.log('Conversation member joined event received:', {
          eventId: envelope.id,
          conversationId: payload.conversationId,
          userId: payload.userId,
        });

        await queueService.addJob('main-queue', 'conversation.member_joined', {
          eventId: envelope.id,
          conversationId: payload.conversationId,
          userId: payload.userId,
        });
      },
    },
  ];
}
