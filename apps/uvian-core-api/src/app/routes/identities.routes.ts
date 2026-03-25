import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { identityService } from '../services/identity.service';

interface CreateIdentityBody {
  provider?: 'whatsapp' | 'slack' | 'telegram' | 'discord' | 'email';
  provider_user_id: string;
  metadata?: Record<string, unknown>;
}

interface UpdateIdentityBody {
  provider?: 'whatsapp' | 'slack' | 'telegram' | 'discord' | 'email';
  provider_user_id?: string;
  metadata?: Record<string, unknown>;
}

interface IdentityParams {
  identityId: string;
}

export default async function identityRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/identities',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const identities = await identityService.getIdentitiesByUser(userId);
        reply.send({ identities });
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to fetch identities' });
      }
    }
  );

  fastify.get<{ Params: IdentityParams }>(
    '/api/identities/:identityId',
    {
      preHandler: [fastify.authenticate],
    },
    async (
      request: FastifyRequest<{ Params: IdentityParams }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { identityId } = request.params;
        const identity = await identityService.getIdentityById(identityId);

        if (!identity) {
          reply.code(404).send({ error: 'Identity not found' });
          return;
        }

        if (identity.user_id !== userId) {
          reply
            .code(403)
            .send({ error: 'Not authorized to view this identity' });
          return;
        }

        reply.send({ identity });
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to fetch identity' });
      }
    }
  );

  fastify.post<{ Body: CreateIdentityBody }>(
    '/api/identities',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['provider_user_id'],
          properties: {
            provider: {
              type: 'string',
              enum: ['whatsapp', 'slack', 'telegram', 'discord', 'email'],
            },
            provider_user_id: { type: 'string' },
            metadata: { type: 'object' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: CreateIdentityBody }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const existing = await identityService.getIdentityByProviderUserId(
          request.body.provider || 'whatsapp',
          request.body.provider_user_id
        );

        if (existing) {
          reply
            .code(409)
            .send({ error: 'Identity already exists for this provider user' });
          return;
        }

        const identity = await identityService.createIdentity(userId, {
          ...request.body,
          provider: request.body.provider || 'whatsapp',
          user_id: userId,
        });

        fastify.eventEmitter.emitIdentityCreated(
          { identityId: identity.id, userId, provider: identity.provider },
          userId
        );

        reply.send({ identity });
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to create identity' });
      }
    }
  );

  fastify.put<{ Params: IdentityParams; Body: UpdateIdentityBody }>(
    '/api/identities/:identityId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          properties: {
            provider: {
              type: 'string',
              enum: ['whatsapp', 'slack', 'telegram', 'discord', 'email'],
            },
            provider_user_id: { type: 'string' },
            metadata: { type: 'object' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: IdentityParams;
        Body: UpdateIdentityBody;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { identityId } = request.params;
        const existing = await identityService.getIdentityById(identityId);

        if (!existing) {
          reply.code(404).send({ error: 'Identity not found' });
          return;
        }

        if (existing.user_id !== userId) {
          reply
            .code(403)
            .send({ error: 'Not authorized to update this identity' });
          return;
        }

        const identity = await identityService.updateIdentity(
          identityId,
          userId,
          request.body
        );

        fastify.eventEmitter.emitIdentityUpdated(
          { identityId: identity.id, userId },
          userId
        );

        reply.send({ identity });
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to update identity' });
      }
    }
  );

  fastify.delete<{ Params: IdentityParams }>(
    '/api/identities/:identityId',
    {
      preHandler: [fastify.authenticate],
    },
    async (
      request: FastifyRequest<{ Params: IdentityParams }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { identityId } = request.params;
        const existing = await identityService.getIdentityById(identityId);

        if (!existing) {
          reply.code(404).send({ error: 'Identity not found' });
          return;
        }

        if (existing.user_id !== userId) {
          reply
            .code(403)
            .send({ error: 'Not authorized to delete this identity' });
          return;
        }

        await identityService.deleteIdentity(identityId, userId);

        fastify.eventEmitter.emitIdentityDeleted(
          { identityId, userId },
          userId
        );

        reply.code(204).send();
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to delete identity' });
      }
    }
  );
}
