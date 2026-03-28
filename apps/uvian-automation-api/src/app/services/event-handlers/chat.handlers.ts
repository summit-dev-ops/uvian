import { adminSupabase } from '../../clients/supabase.client';
import { jobService } from '../';
import {
  WebhookEnvelope,
  MessagingEvents,
  MessageCreatedData,
} from '@org/uvian-events';

interface ExternalMessageData extends MessageCreatedData {
  platform?: string;
  externalChannelId?: string;
  externalUserId?: string;
  guildId?: string | null;
}

export function registerChatHandlers(webhookHandler: any) {
  const clients = { adminClient: adminSupabase, userClient: adminSupabase };

  webhookHandler.registerHandler(
    MessagingEvents.MESSAGE_CREATED,
    async (envelope: WebhookEnvelope, agentId?: string) => {
      const payload = envelope.data as MessageCreatedData;
      const externalData = payload as ExternalMessageData;

      console.log('Message created:', {
        messageId: payload.messageId,
        content: payload.content,
        conversationId: payload.conversationId,
        source: envelope.source,
        subject: envelope.subject,
        agentId,
        platform: externalData.platform,
      });

      const jobInput: Record<string, unknown> = {
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
      };

      if (externalData.platform) {
        jobInput.resource = {
          type: 'message',
          id: payload.messageId,
          data: {
            content: payload.content,
            assetIds: payload.assetIds,
            platform: externalData.platform,
            externalChannelId: externalData.externalChannelId,
            externalUserId: externalData.externalUserId,
            guildId: externalData.guildId,
          },
        };
      }

      await jobService.scoped(clients).createEventJob({
        type: 'agent',
        input: jobInput,
      });
    }
  );
}
