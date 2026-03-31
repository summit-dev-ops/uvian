import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { apiKeyService } from '../services';
import { adminSupabase } from '../clients/supabase.client';

const clients = {
  adminClient: adminSupabase,
  userClient: adminSupabase,
};

interface CreateDiscordApiKeyBody {
  userId: string;
}

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateDiscordApiKeyBody }>(
    '/api/auth/api-key',
    {
      preHandler: [fastify.authenticateInternal],
      schema: {
        body: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: CreateDiscordApiKeyBody }>,
      reply: FastifyReply
    ) => {
      const { userId } = request.body;

      try {
        const existingKeys = await apiKeyService
          .scoped(clients)
          .getApiKeysByUser(userId);

        const activeDiscordKey = existingKeys.find(
          (k) => k.service === 'discord' && k.is_active
        );

        if (activeDiscordKey) {
          return reply.code(200).send({
            exists: true,
            keyPrefix: activeDiscordKey.api_key_prefix,
          });
        }

        const result = await apiKeyService
          .scoped(clients)
          .createApiKey(userId, { service: 'discord' });

        return reply.code(201).send(result);
      } catch (error) {
        fastify.log.error({ error }, 'Failed to create Discord API key');
        return reply
          .code(500)
          .send({ error: 'Failed to create Discord API key' });
      }
    }
  );
}
