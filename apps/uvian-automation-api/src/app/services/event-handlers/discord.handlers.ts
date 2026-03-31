import { adminSupabase } from '../../clients/supabase.client';
import { jobService } from '../';
import {
  WebhookEnvelope,
  DiscordEvents,
  DiscordMessageCreatedData,
  DiscordInteractionData,
} from '@org/uvian-events';

export function registerDiscordHandlers(webhookHandler: any) {
  const clients = { adminClient: adminSupabase, userClient: adminSupabase };

  webhookHandler.registerHandler(
    DiscordEvents.MESSAGE_CREATED,
    async (envelope: WebhookEnvelope, agentId?: string) => {
      const payload = envelope.data as DiscordMessageCreatedData;

      console.log('Discord message created:', {
        messageId: payload.messageId,
        content: payload.content,
        externalChannelId: payload.externalChannelId,
        externalUserId: payload.externalUserId,
        source: envelope.source,
        subject: envelope.subject,
        isDm: payload.isDm,
        guildId: payload.guildId,
      });

      await jobService.scoped(clients).createEventJob({
        type: 'agent',
        input: {
          agentId: agentId,
          eventId: envelope.id,
          eventType: 'com.uvian.discord.message_created',
          actor: { id: envelope.subject, type: 'user' },
          resource: {
            type: 'discord_message',
            id: payload.messageId,
            data: {
              content: payload.content,
              externalChannelId: payload.externalChannelId,
              externalUserId: payload.externalUserId,
              externalMessageId: payload.externalMessageId,
              guildId: payload.guildId,
              isDm: payload.isDm,
            },
          },
          context: {
            externalChannelId: payload.externalChannelId,
            externalUserId: payload.externalUserId,
            guildId: payload.guildId,
            isDm: payload.isDm,
            platform: 'discord',
          },
        },
      });
    }
  );

  webhookHandler.registerHandler(
    DiscordEvents.INTERACTION_RECEIVED,
    async (envelope: WebhookEnvelope, agentId?: string) => {
      const payload = envelope.data as DiscordInteractionData;

      console.log('Discord interaction received:', {
        interactionTypeName: payload.interactionTypeName,
        commandName: payload.commandName,
        customId: payload.customId,
        externalChannelId: payload.externalChannelId,
        externalUserId: payload.externalUserId,
        source: envelope.source,
        subject: envelope.subject,
      });

      await jobService.scoped(clients).createEventJob({
        type: 'agent',
        input: {
          agentId: agentId,
          eventId: envelope.id,
          eventType: 'com.uvian.discord.interaction_received',
          actor: { id: envelope.subject, type: 'user' },
          resource: {
            type: 'discord_interaction',
            id: `interaction-${payload.externalMessageId || 'unknown'}`,
            data: {
              interactionTypeName: payload.interactionTypeName,
              commandName: payload.commandName,
              customId: payload.customId,
              options: payload.options,
              values: payload.values,
              modalData: payload.modalData,
              externalChannelId: payload.externalChannelId,
              externalUserId: payload.externalUserId,
            },
          },
          context: {
            externalChannelId: payload.externalChannelId,
            externalUserId: payload.externalUserId,
            guildId: payload.guildId,
            platform: 'discord',
          },
        },
      });
    }
  );
}
