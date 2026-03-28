import { adminSupabase } from '../../clients/supabase.client';
import { jobService } from '../job.service';
import {
  WebhookEnvelope,
  MessagingEvents,
  ConversationMemberJoinedData,
  MessageCreatedData,
} from '@org/uvian-events';

export function registerConversationEventHandlers() {
  const clients = { adminClient: adminSupabase, userClient: adminSupabase };

  return [
    {
      eventType: MessagingEvents.MESSAGE_CREATED,
      handler: async (envelope: WebhookEnvelope, agentId?: string) => {
        const payload = envelope.data as MessageCreatedData;

        console.log('Conversation message event received:', {
          eventId: envelope.id,
          conversationId: payload.conversationId,
          source: envelope.source,
          agentId,
        });

        await jobService.createEventJob(clients, {
          type: 'agent',
          input: {
            eventId: envelope.id,
            eventType: 'message.created',
            actor: { id: payload.senderId, type: 'user' },
            resource: {
              type: 'message',
              id: payload.messageId,
              data: { content: payload.content, assetIds: payload.assetIds },
            },
            context: { conversationId: payload.conversationId },
            agentId,
          },
        });
      },
    },
    {
      eventType: MessagingEvents.CONVERSATION_MEMBER_JOINED,
      handler: async (envelope: WebhookEnvelope, agentId?: string) => {
        const payload = envelope.data as ConversationMemberJoinedData;

        console.log('Conversation member joined event received:', {
          eventId: envelope.id,
          conversationId: payload.conversationId,
          userId: payload.userId,
          agentId,
        });

        await jobService.createEventJob(clients, {
          type: 'agent',
          input: {
            eventId: envelope.id,
            eventType: 'conversation.member_joined',
            actor: { id: payload.userId, type: 'user' },
            resource: {
              type: 'conversation',
              id: payload.conversationId,
              data: {},
            },
            context: { conversationId: payload.conversationId },
            agentId,
          },
        });
      },
    },
  ];
}
