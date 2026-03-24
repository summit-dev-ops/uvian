import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  ApiKeyService,
  checkAccountMembership,
} from '../services/api-key.service';

interface CreateApiKeyBody {
  userId: string;
}

interface RevokeApiKeyBody {
  userId: string;
  apiKeyPrefix?: string;
}

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.addHook(
    'preHandler',
    async (request: FastifyRequest, reply: FastifyReply) => {
      await (fastify as any).authenticateInternal(request, reply);
    }
  );

  fastify.post<{ Body: CreateApiKeyBody }>(
    '/api/auth/api-key',
    {
      preHandler: [],
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
      const authenticatedUserId = (request as any).userId;
      const { userId: targetUserId } = request.body;

      const internalKey = request.headers['x-api-key'];
      const isInternalAuth =
        internalKey === process.env.SECRET_INTERNAL_API_KEY;

      if (!isInternalAuth && authenticatedUserId) {
        const hasAccess = await checkAccountMembership(
          authenticatedUserId,
          targetUserId
        );
        if (!hasAccess) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'Target user must be in the same account',
          });
        }
      }

      try {
        const result = await ApiKeyService.createApiKey(
          targetUserId,
          'automation-api'
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
      preHandler: [],
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
      const authenticatedUserId = (request as any).userId;
      const { userId: targetUserId, apiKeyPrefix } = request.body;

      const internalKey = request.headers['x-api-key'];
      const isInternalAuth =
        internalKey === process.env.SECRET_INTERNAL_API_KEY;

      if (!isInternalAuth && authenticatedUserId) {
        const hasAccess = await checkAccountMembership(
          authenticatedUserId,
          targetUserId
        );
        if (!hasAccess) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'Target user must be in the same account',
          });
        }
      }

      try {
        await ApiKeyService.revokeApiKey(
          targetUserId,
          'automation-api',
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
