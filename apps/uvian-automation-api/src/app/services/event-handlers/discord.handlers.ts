import { jobService } from '../job.service';
import {
  WebhookEnvelope,
  DiscordEvents,
  DiscordMessageCreatedData,
  DiscordInteractionData,
} from '@org/uvian-events';

export function registerDiscordHandlers(webhookHandler: any) {
  webhookHandler.registerHandler(
    DiscordEvents.MESSAGE_CREATED,
    async (envelope: WebhookEnvelope) => {
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

      await jobService.createEventJob({
        type: 'agent',
        input: {
          eventId: envelope.id,
          eventType: 'discord.message_created',
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
    async (envelope: WebhookEnvelope) => {
      const payload = envelope.data as DiscordInteractionData;

      console.log('Discord interaction received:', {
        commandName: payload.commandName,
        externalChannelId: payload.externalChannelId,
        externalUserId: payload.externalUserId,
        source: envelope.source,
        subject: envelope.subject,
      });

      await jobService.createEventJob({
        type: 'agent',
        input: {
          eventId: envelope.id,
          eventType: 'discord.interaction_received',
          actor: { id: envelope.subject, type: 'user' },
          resource: {
            type: 'discord_interaction',
            id: `interaction-${payload.externalMessageId || 'unknown'}`,
            data: {
              commandName: payload.commandName,
              options: payload.options,
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
