import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

/**
 * Discord HTTP Interactions Endpoint
 *
 * This endpoint handles Discord's HTTP-based interaction callbacks.
 * Currently only handles PING (type 1) for health checks.
 *
 * All other interaction types (slash commands, buttons, modals, context menus)
 * are now handled via the WebSocket gateway (gateway.ts) using the
 * interactionCreate event listener.
 *
 * The PING handler must remain here for Discord's endpoint verification.
 */

interface DiscordPingInteraction {
  type: 1;
  token: string;
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
      request: FastifyRequest<{ Body: DiscordPingInteraction }>,
      reply: FastifyReply
    ) => {
      try {
        const interaction = request.body as DiscordPingInteraction;

        // Type 1: PING - Discord health check (required for endpoint verification)
        if (interaction.type === 1) {
          reply.code(200).send({ type: 1 });
          return;
        }

        // All other interaction types are handled by the gateway WebSocket
        // This endpoint should not receive them if gateway is connected
        fastify.log.warn(
          { interactionType: interaction.type },
          'Received interaction via HTTP that should be handled by gateway'
        );

        reply.code(200).send({ type: 1 });
      } catch (error) {
        fastify.log.error(error, 'Error processing Discord interaction');
        reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );
}
