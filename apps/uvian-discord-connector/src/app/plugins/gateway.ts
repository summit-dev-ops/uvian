import fp from 'fastify-plugin';
import {
  Client,
  GatewayIntentBits,
  Message,
  REST,
  Routes,
  SlashCommandBuilder,
} from 'discord.js';
import { identityService, clients } from '../services/index.js';

declare module 'fastify' {
  interface FastifyInstance {
    discordClient: Client;
  }
}

const commands = [
  new SlashCommandBuilder()
    .setName('link')
    .setDescription('Link your Discord account to Uvian')
    .toJSON(),
  new SlashCommandBuilder()
    .setName('activate')
    .setDescription('Activate an agent for this channel')
    .addStringOption((opt) =>
      opt.setName('agent').setDescription('Agent name').setRequired(true)
    )
    .toJSON(),
  new SlashCommandBuilder()
    .setName('deactivate')
    .setDescription('Deactivate agents for this channel')
    .toJSON(),
];

export default fp(async (fastify) => {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const applicationId = process.env.DISCORD_APPLICATION_ID;

  if (!botToken) {
    fastify.log.warn(
      'DISCORD_BOT_TOKEN not set - Discord Gateway will not start'
    );
    return;
  }

  const client = new Client({
    intents: [
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

      fastify.eventEmitter.emitMessageCreated(
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

  if (applicationId) {
    try {
      const rest = new REST({ version: '10' }).setToken(botToken);

      fastify.log.info('Registering Discord slash commands...');
      await rest.put(Routes.applicationCommands(applicationId), {
        body: commands,
      });
      fastify.log.info(
        `Successfully registered ${commands.length} slash commands`
      );
    } catch (error) {
      fastify.log.error(error, 'Failed to register slash commands');
    }
  } else {
    fastify.log.warn(
      'DISCORD_APPLICATION_ID not set - skipping slash command registration'
    );
  }

  fastify.decorate('discordClient', client);

  fastify.addHook('onClose', async () => {
    fastify.log.info('Disconnecting Discord Gateway');
    await client.destroy();
  });
});
