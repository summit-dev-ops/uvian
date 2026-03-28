import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { apiKeyService, accountService } from '../services';
import { adminSupabase } from '../clients/supabase.client';

interface CreateApiKeyBody {
  userId: string;
}

interface RevokeApiKeyBody {
  userId: string;
  apiKeyPrefix?: string;
}

function getClients(request: FastifyRequest) {
  return {
    adminClient: adminSupabase,
    userClient: request.supabase,
  };
}

export async function authRoutes(fastify: FastifyInstance) {
  fastify.addHook(
    'preHandler',
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.user) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }
    }
  );

  fastify.post<{ Body: CreateApiKeyBody }>(
    '/api/auth/api-key',
    {
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
    async (request, reply) => {
      const authenticatedUserId = request.user!.id;
      const { userId: targetUserId } = request.body;
      const clients = getClients(request);

      const hasAccess = await accountService.checkAccountMembership(
        clients,
        authenticatedUserId,
        targetUserId
      );
      if (!hasAccess) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Target user must be in the same account',
        });
      }

      try {
        const result = await apiKeyService.createApiKey(
          clients,
          targetUserId,
          'hub-api'
        );
        return reply.code(201).send(result);
      } catch (error) {
        fastify.log.error({ error }, 'Failed to create API key');
        return reply.code(500).send({ error: 'Failed to create API key' });
      }
    }
  );

  fastify.delete<{ Body: RevokeApiKeyBody }>(
    '/api/auth/api-key',
    {
      schema: {
        body: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string', format: 'uuid' },
            apiKeyPrefix: { type: 'string', minLength: 16, maxLength: 16 },
          },
        },
      },
    },
    async (request, reply) => {
      const authenticatedUserId = request.user!.id;
      const { userId: targetUserId, apiKeyPrefix } = request.body;
      const clients = getClients(request);

      const hasAccess = await accountService.checkAccountMembership(
        clients,
        authenticatedUserId,
        targetUserId
      );
      if (!hasAccess) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Target user must be in the same account',
        });
      }

      try {
        await apiKeyService.revokeApiKey(
          clients,
          targetUserId,
          'hub-api',
          apiKeyPrefix
        );
        return reply.send({ success: true });
      } catch (error) {
        fastify.log.error({ error }, 'Failed to revoke API key');
        return reply.code(500).send({ error: 'Failed to revoke API key' });
      }
    }
  );
}
