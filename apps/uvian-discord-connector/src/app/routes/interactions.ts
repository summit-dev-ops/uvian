import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eventEmitter } from '../plugins/event-emitter.js';
import {
  identityService,
  subscriptionService,
  userService,
  clients,
} from '../services/index.js';

interface DiscordInteraction {
  type: number;
  data: {
    name?: string;
    options?: Array<{ name: string; value: string }>;
  };
  member?: {
    user: {
      id: string;
      username: string;
    };
  };
  user?: {
    id: string;
    username: string;
  };
  channel_id?: string;
  guild_id?: string;
  message?: {
    id: string;
    channel_id: string;
  };
}

export default async function interactionsRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/interactions',
    async (request: FastifyRequest, reply: FastifyReply) => {
      reply.code(200).send();
    }
  );

  fastify.post(
    '/api/interactions',
    async (
      request: FastifyRequest<{ Body: DiscordInteraction }>,
      reply: FastifyReply
    ) => {
      try {
        const interaction = request.body as DiscordInteraction;
        const interactionType = interaction.type;

        if (interactionType === 1) {
          reply.code(200).send({ type: 1 });
          return;
        }

        const userId = interaction.member?.user?.id || interaction.user?.id;
        const channelId =
          interaction.channel_id || interaction.message?.channel_id;
        const guildId = interaction.guild_id;

        if (!userId) {
          reply.code(400).send({ error: 'No user ID found in interaction' });
          return;
        }

        const identity = await identityService.getIdentityByProviderUserId(
          clients,
          'discord',
          userId
        );

        const senderId = identity?.user_id || 'external';
        const source = channelId ? `/discord/${channelId}` : '/discord';

        if (interactionType === 2 && interaction.data?.name) {
          const commandName = interaction.data.name;

          if (commandName === 'activate') {
            const agentNameOption = interaction.data.options?.find(
              (opt) => opt.name === 'agent'
            );
            const agentName = agentNameOption?.value;

            if (!agentName) {
              reply.code(200).send({
                type: 4,
                data: { content: 'Usage: /activate agent: <agent_name>' },
              });
              return;
            }

            try {
              const users = await userService.searchUsers(clients, {
                query: agentName,
                includeAgents: true,
                limit: 1,
              });
              const agent = users[0];

              if (!agent) {
                reply.code(200).send({
                  type: 4,
                  data: {
                    content: `Agent "${agentName}" not found.`,
                  },
                });
                return;
              }

              await subscriptionService.activateSubscription(
                clients,
                agent.id,
                'discord',
                channelId || 'dm'
              );

              reply.code(200).send({
                type: 4,
                data: {
                  content: `Activated agent for this channel.`,
                },
              });
              return;
            } catch (error) {
              fastify.log.error(error, 'Error activating agent');
              reply.code(200).send({
                type: 4,
                data: {
                  content: 'Error activating agent. Please try again.',
                },
              });
              return;
            }
          }

          if (commandName === 'deactivate') {
            try {
              if (!identity?.user_id) {
                reply.code(200).send({
                  type: 4,
                  data: {
                    content:
                      'Your Discord account is not linked. Please link it first.',
                  },
                });
                return;
              }

              await subscriptionService.deactivateSubscription(
                clients,
                identity.user_id,
                'discord',
                channelId || 'dm'
              );

              reply.code(200).send({
                type: 4,
                data: {
                  content:
                    'Deactivated agent for this channel. All subscribed agents will now receive events.',
                },
              });
              return;
            } catch (error) {
              fastify.log.error(error, 'Error deactivating agent');
              reply.code(200).send({
                type: 4,
                data: {
                  content: 'Error deactivating agent. Please try again.',
                },
              });
              return;
            }
          }

          let content = `/${commandName}`;

          if (interaction.data.options) {
            const options = interaction.data.options
              .map((opt) => `${opt.name}: ${opt.value}`)
              .join(', ');
            content += ` ${options}`;
          }

          eventEmitter.emitMessageCreated(
            {
              messageId: `interaction-${Date.now()}`,
              content,
              externalChannelId: channelId || 'dm',
              externalUserId: userId,
              externalMessageId: `interaction-${Date.now()}`,
              guildId: guildId,
              isDm: !channelId,
            },
            senderId,
            source
          );
        }

        reply
          .code(200)
          .send({ type: 4, data: { content: 'Processing your request...' } });
      } catch (error) {
        fastify.log.error(error, 'Error processing Discord interaction');
        reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );
}
