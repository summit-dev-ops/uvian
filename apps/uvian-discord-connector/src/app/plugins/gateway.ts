import fp from 'fastify-plugin';
import {
  Client,
  GatewayIntentBits,
  Message,
  REST,
  Routes,
  SlashCommandBuilder,
  Interaction,
  ChatInputCommandInteraction,
  MessageComponentInteraction,
  ModalSubmitInteraction,
  ContextMenuCommandInteraction,
} from 'discord.js';
import {
  identityService,
  subscriptionService,
  userService,
  clients,
} from '../services/index.js';
import { generateRSAKeyPair } from '@org/utils-encryption';
import { CoreEvents } from '@org/uvian-events';

declare module 'fastify' {
  interface FastifyInstance {
    discordClient: Client;
  }
}

const INTAKE_API_URL = (
  process.env.INTAKE_API_URL || 'http://localhost:8001'
).replace(/\/+$/, '');
const INTAKE_API_KEY = process.env.SECRET_INTERNAL_API_KEY || '';
const DISCORD_CONNECTOR_URL = (
  process.env.DISCORD_CONNECTOR_URL || 'http://localhost:4000'
).replace(/\/+$/, '');

export const commands = [
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

  client.on('interactionCreate', async (interaction: Interaction) => {
    try {
      const discordUserId =
        interaction.user?.id || interaction.member?.user?.id;
      const channelId = interaction.channelId || '';
      const guildId = interaction.guildId || undefined;
      const isDm = !interaction.guildId;

      if (!discordUserId) {
        fastify.log.warn('Interaction received without user ID');
        await safeReply(interaction, {
          content: 'Something went wrong. Please try again.',
          ephemeral: true,
        });
        return;
      }

      const identity = await identityService
        .admin(clients)
        .getIdentityByProviderUserId('discord', discordUserId);

      const senderId = identity?.user_id || 'external';
      const source = `/discord/${channelId}`;

      if (interaction.isChatInputCommand()) {
        await handleChatInputCommand(
          fastify,
          interaction as ChatInputCommandInteraction,
          discordUserId,
          channelId,
          guildId,
          isDm,
          senderId,
          source
        );
      } else if (interaction.isMessageComponent()) {
        await handleMessageComponent(
          fastify,
          interaction as MessageComponentInteraction,
          discordUserId,
          channelId,
          guildId,
          isDm,
          senderId,
          source
        );
      } else if (interaction.isModalSubmit()) {
        await handleModalSubmit(
          fastify,
          interaction as ModalSubmitInteraction,
          discordUserId,
          channelId,
          guildId,
          isDm,
          senderId,
          source
        );
      } else if (interaction.isContextMenuCommand()) {
        await handleContextMenuCommand(
          fastify,
          interaction as ContextMenuCommandInteraction,
          discordUserId,
          channelId,
          guildId,
          isDm,
          senderId,
          source
        );
      } else {
        fastify.log.warn(
          { interactionType: interaction.type },
          'Unhandled interaction type'
        );
      }
    } catch (error) {
      fastify.log.error(error, 'Error processing Discord interaction');
      await safeReply(interaction, {
        content: 'Something went wrong. Please try again.',
        ephemeral: true,
      });
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

async function handleChatInputCommand(
  fastify: any,
  interaction: ChatInputCommandInteraction,
  discordUserId: string,
  channelId: string,
  guildId: string | undefined,
  isDm: boolean,
  senderId: string,
  source: string
) {
  const commandName = interaction.commandName;
  const options = interaction.options.data.map((opt) => ({
    name: opt.name,
    value: opt.value?.toString() || '',
  }));

  if (commandName === 'link') {
    await handleLinkCommand(fastify, interaction, discordUserId, senderId);
    return;
  }

  if (commandName === 'activate') {
    await handleActivateCommand(
      fastify,
      interaction,
      discordUserId,
      channelId,
      senderId,
      options
    );
    return;
  }

  if (commandName === 'deactivate') {
    await handleDeactivateCommand(
      fastify,
      interaction,
      discordUserId,
      channelId,
      senderId
    );
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  fastify.eventEmitter.emitInteractionReceived(
    {
      interactionType: interaction.type,
      interactionTypeName: 'ChatInputCommand',
      commandName,
      options,
      externalChannelId: channelId,
      externalUserId: discordUserId,
      externalMessageId: interaction.id,
      guildId,
      isDm,
    },
    senderId,
    source
  );

  await interaction.editReply({
    content: 'Interaction received and processing...',
  });
}

async function handleMessageComponent(
  fastify: any,
  interaction: MessageComponentInteraction,
  discordUserId: string,
  channelId: string,
  guildId: string | undefined,
  isDm: boolean,
  senderId: string,
  source: string
) {
  const customId = interaction.customId;

  await interaction.deferUpdate();

  let values: string[] | undefined;
  if (interaction.isStringSelectMenu()) {
    values = interaction.values;
  }

  fastify.eventEmitter.emitInteractionReceived(
    {
      interactionType: interaction.type,
      interactionTypeName: 'MessageComponent',
      customId,
      values,
      externalChannelId: channelId,
      externalUserId: discordUserId,
      externalMessageId: interaction.id,
      guildId,
      isDm,
    },
    senderId,
    source
  );
}

async function handleModalSubmit(
  fastify: any,
  interaction: ModalSubmitInteraction,
  discordUserId: string,
  channelId: string,
  guildId: string | undefined,
  isDm: boolean,
  senderId: string,
  source: string
) {
  const customId = interaction.customId;
  const modalData: Record<string, string> = {};

  interaction.fields.fields.forEach((field) => {
    if (field.type === 4) {
      modalData[field.customId] = field.value;
    }
  });

  await interaction.deferReply({ ephemeral: true });

  fastify.eventEmitter.emitInteractionReceived(
    {
      interactionType: interaction.type,
      interactionTypeName: 'ModalSubmit',
      customId,
      modalData,
      externalChannelId: channelId,
      externalUserId: discordUserId,
      externalMessageId: interaction.id,
      guildId,
      isDm,
    },
    senderId,
    source
  );

  await interaction.editReply({
    content: 'Modal submission received and processing...',
  });
}

async function handleContextMenuCommand(
  fastify: any,
  interaction: ContextMenuCommandInteraction,
  discordUserId: string,
  channelId: string,
  guildId: string | undefined,
  isDm: boolean,
  senderId: string,
  source: string
) {
  const commandName = interaction.commandName;

  await interaction.deferReply({ ephemeral: true });

  fastify.eventEmitter.emitInteractionReceived(
    {
      interactionType: interaction.type,
      interactionTypeName: 'ContextMenuCommand',
      commandName,
      externalChannelId: channelId,
      externalUserId: discordUserId,
      externalMessageId: interaction.id,
      guildId,
      isDm,
    },
    senderId,
    source
  );

  await interaction.editReply({
    content: 'Context menu interaction received and processing...',
  });
}

async function handleLinkCommand(
  fastify: any,
  interaction: ChatInputCommandInteraction,
  discordUserId: string,
  _senderId: string
) {
  try {
    const { publicKey } = generateRSAKeyPair();
    const discordUsername = interaction.user?.username || 'unknown';

    const intakeResponse = await fetch(`${INTAKE_API_URL}/api/intakes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': INTAKE_API_KEY,
      },
      body: JSON.stringify({
        title: 'Link Discord Account',
        description: `Link your Discord account (@${discordUsername}) to your Uvian account. This allows agents to respond to your messages.`,
        submitLabel: 'Link Account',
        publicKey,
        schema: { fields: [] },
        metadata: {
          type: 'discord_link',
          discordUserId,
          discordUsername,
        },
        requiresAuth: true,
        expiresInSeconds: 300,
        createdBy: 'discord-bot',
      }),
    });

    if (!intakeResponse.ok) {
      throw new Error(`Intake API returned ${intakeResponse.status}`);
    }

    const intakeResult = (await intakeResponse.json()) as {
      url: string;
    };

    await interaction.reply({
      content: `Click the link below to connect your Discord account to Uvian. You will need to sign in to your Uvian account.\n\n${intakeResult.url}`,
      ephemeral: true,
    });
  } catch (error) {
    fastify.log.error(error, 'Error creating link intake');
    await interaction.reply({
      content: 'Error creating link. Please try again.',
      ephemeral: true,
    });
  }
}

async function handleActivateCommand(
  fastify: any,
  interaction: ChatInputCommandInteraction,
  discordUserId: string,
  channelId: string,
  senderId: string,
  options: Array<{ name: string; value: string }>
) {
  if (senderId === 'external') {
    await interaction.reply({
      content:
        'Your Discord account is not linked. Run /link first to connect your account.',
      ephemeral: true,
    });
    return;
  }

  const agentName = options.find((opt) => opt.name === 'agent')?.value;

  if (!agentName) {
    await interaction.reply({
      content: 'Usage: /activate agent:<agent_name>',
      ephemeral: true,
    });
    return;
  }

  try {
    const users = await userService.admin(clients).searchUsers({
      query: agentName,
      includeAgents: true,
      limit: 1,
    });
    const agent = users[0];

    if (!agent) {
      await interaction.reply({
        content: `Agent "${agentName}" not found.`,
        ephemeral: true,
      });
      return;
    }

    const { data: membership, error: memberError } = await clients.adminClient
      .from('account_members')
      .select('account_id')
      .eq('user_id', agent.id)
      .single();

    if (memberError || !membership) {
      fastify.log.error(
        memberError,
        'Failed to find account membership for agent'
      );
      await interaction.reply({
        content: `Agent "${agentName}" is not configured.`,
        ephemeral: true,
      });
      return;
    }

    const accountId = membership.account_id;

    await subscriptionService
      .scoped(clients)
      .activateSubscription(agent.id, 'discord.channel', channelId || 'dm');

    fastify.eventEmitter.emit(
      CoreEvents.MCP_PROVISIONING_REQUESTED,
      `/agents/${agent.id}/mcp-provisioning`,
      {
        agentId: agent.id,
        accountId,
        mcpType: 'discord',
        mcpUrl: `${DISCORD_CONNECTOR_URL}/v1/mcp`,
        mcpName: 'Discord',
      },
      senderId
    );

    await interaction.reply({
      content: `Activated agent "${agentName}" for this channel.`,
      ephemeral: true,
    });
  } catch (error) {
    fastify.log.error(error, 'Error activating agent');
    await interaction.reply({
      content: 'Error activating agent. Please try again.',
      ephemeral: true,
    });
  }
}

async function handleDeactivateCommand(
  fastify: any,
  interaction: ChatInputCommandInteraction,
  discordUserId: string,
  channelId: string,
  senderId: string
) {
  if (senderId === 'external') {
    await interaction.reply({
      content: 'Your Discord account is not linked. Please link it first.',
      ephemeral: true,
    });
    return;
  }

  try {
    const channelIdentifier = channelId || 'dm';

    const { data: subscription, error: fetchError } = await clients.adminClient
      .from('subscriptions')
      .select('user_id')
      .eq('resource_type', 'discord.channel')
      .eq('resource_id', channelIdentifier)
      .eq('is_active', true)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new Error(`Failed to find subscription: ${fetchError.message}`);
    }

    if (!subscription) {
      await interaction.reply({
        content: 'No agent is currently activated for this channel.',
        ephemeral: true,
      });
      return;
    }

    await subscriptionService
      .scoped(clients)
      .deactivateSubscription(
        subscription.user_id,
        'discord.channel',
        channelIdentifier
      );

    await interaction.reply({
      content: 'Deactivated agent for this channel.',
      ephemeral: true,
    });
  } catch (error) {
    fastify.log.error(error, 'Error deactivating agent');
    await interaction.reply({
      content: 'Error deactivating agent. Please try again.',
      ephemeral: true,
    });
  }
}

async function safeReply(
  interaction: Interaction,
  options: { content: string; ephemeral?: boolean }
) {
  try {
    if (interaction.isRepliable()) {
      if (interaction.deferred) {
        await interaction.editReply(options.content);
      } else if (!interaction.replied) {
        await interaction.reply(options);
      }
    }
  } catch {
    // Interaction already expired, nothing we can do
  }
}
