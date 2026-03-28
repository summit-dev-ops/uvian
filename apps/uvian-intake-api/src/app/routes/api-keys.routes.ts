import { FastifyInstance } from 'fastify';
import { accountService, apiKeyService } from '../services';
import { adminSupabase } from '../clients/supabase.client';

interface CreateApiKeyBody {
  userId: string;
}

interface RevokeApiKeyBody {
  userId: string;
  apiKeyPrefix?: string;
}

export default async function apiKeysRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateApiKeyBody }>(
    '/auth/api-key',
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
      const { userId: targetUserId } = request.body as CreateApiKeyBody;
      const clients = {
        adminClient: adminSupabase,
        userClient: request.supabase,
      };

      const hasAccess = await accountService.checkAccountMembership(
        clients,
        request.user!.id,
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
          'intake-api'
        );
        return reply.code(201).send(result);
      } catch (error) {
        fastify.log.error({ error }, 'Failed to create API key');
        return reply.code(500).send({ error: 'Failed to create API key' });
      }
    }
  );

  fastify.delete<{ Body: RevokeApiKeyBody }>(
    '/auth/api-key',
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
      const { userId: targetUserId, apiKeyPrefix } =
        request.body as RevokeApiKeyBody;
      const clients = {
        adminClient: adminSupabase,
        userClient: request.supabase,
      };

      const hasAccess = await accountService.checkAccountMembership(
        clients,
        request.user!.id,
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
          'intake-api',
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
