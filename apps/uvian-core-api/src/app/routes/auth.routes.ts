import { FastifyInstance, FastifyRequest } from 'fastify';
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
  fastify.post<{ Body: CreateApiKeyBody }>(
    '/api/auth/api-key',
    {
      preHandler: async (request, reply) => {
        const internalKey = request.headers['x-api-key'];
        const isInternalAuth =
          internalKey === process.env.SECRET_INTERNAL_API_KEY;

        if (isInternalAuth) return;

        if (!request.user) {
          return reply.code(401).send({
            error: 'Unauthorized',
            message: 'Authentication required',
          });
        }
      },
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
      const internalKey = request.headers['x-api-key'];
      const isInternalAuth =
        internalKey === process.env.SECRET_INTERNAL_API_KEY;

      let targetUserId: string;
      const clients = getClients(request);

      if (isInternalAuth) {
        targetUserId = request.body.userId;
      } else {
        const authenticatedUserId = request.user!.id;
        targetUserId = request.body.userId;

        const hasAccess = await accountService
          .admin(clients)
          .checkAccountMembership(authenticatedUserId, targetUserId);
        if (!hasAccess) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'Target user must be in the same account',
          });
        }
      }

      try {
        const result = await apiKeyService
          .scoped(clients)
          .createApiKey(targetUserId, { service: 'core-api' });
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
      preHandler: async (request, reply) => {
        const internalKey = request.headers['x-api-key'];
        const isInternalAuth =
          internalKey === process.env.SECRET_INTERNAL_API_KEY;

        if (isInternalAuth) return;

        if (!request.user) {
          return reply.code(401).send({
            error: 'Unauthorized',
            message: 'Authentication required',
          });
        }
      },
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
      const internalKey = request.headers['x-api-key'];
      const isInternalAuth =
        internalKey === process.env.SECRET_INTERNAL_API_KEY;

      let targetUserId: string;
      let apiKeyPrefix: string | undefined;
      const clients = getClients(request);

      if (isInternalAuth) {
        targetUserId = request.body.userId;
        apiKeyPrefix = request.body.apiKeyPrefix;
      } else {
        targetUserId = request.user!.id;
        apiKeyPrefix = request.body.apiKeyPrefix;

        const hasAccess = await accountService
          .admin(clients)
          .checkAccountMembership(targetUserId, request.body.userId);
        if (!hasAccess) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'Target user must be in the same account',
          });
        }
      }

      try {
        await apiKeyService
          .scoped(clients)
          .revokeApiKey(targetUserId, 'core-api', apiKeyPrefix);
        return reply.send({ success: true });
      } catch (error) {
        fastify.log.error({ error }, 'Failed to revoke API key');
        return reply.code(500).send({ error: 'Failed to revoke API key' });
      }
    }
  );
}
