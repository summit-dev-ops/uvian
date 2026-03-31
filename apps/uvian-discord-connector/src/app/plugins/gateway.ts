import fp from 'fastify-plugin';
import { Client, GatewayIntentBits, Message } from 'discord.js';
import { identityService, clients } from '../services/index.js';
import { eventEmitter } from './event-emitter.js';

declare module 'fastify' {
  interface FastifyInstance {
    discordClient: Client;
  }
}

export default fp(async (fastify) => {
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!botToken) {
    fastify.log.warn(
      'DISCORD_BOT_TOKEN not set - Discord Gateway will not start'
    );
    return;
  }

  const client = new Client({
    intents:[
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.Guilds,
    ],
  });

  client.on('messageCreate', async (message: Message) => {
    if (message.author.bot) return;
    if (!message.content) return;

    try {
      const discordUserId = message.author.id;
      const channelId = message.channelId;
      const content = message.content;
      const messageId = message.id;

      let guildId: string | undefined = undefined;
      if (message.guildId) {
        guildId = message.guildId;
      }

      const isDm = message.channel.isDMBased() ? true : false;

      const identity = await identityService
        .admin(clients)
        .getIdentityByProviderUserId('discord', discordUserId);

      const senderId = identity?.user_id || 'external';
      const source = `/discord/${channelId}`;

      eventEmitter.emitMessageCreated(
        {
          messageId: messageId,
          content: content,
          externalChannelId: channelId,
          externalUserId: discordUserId,
          externalMessageId: messageId,
          guildId: guildId,
          isDm: isDm,
        },
        senderId,
        source
      );
    } catch (error) {
      fastify.log.error(error, 'Error processing Discord message');
    }
  });

  client.on('ready', () => {
    fastify.log.info(`Discord Gateway connected as ${client.user?.tag}`);
  });

  client.on('error', (error: Error) => {
    fastify.log.error(error, 'Discord Gateway error');
  });

  await client.login(botToken);

  fastify.decorate('discordClient', client);

  fastify.addHook('onClose', async () => {
    fastify.log.info('Disconnecting Discord Gateway');
    await client.destroy();
  });
});