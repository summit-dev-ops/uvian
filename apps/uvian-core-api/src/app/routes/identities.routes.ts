import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { identityService } from '../services/factory';
import { adminSupabase } from '../clients/supabase.client';
import {
  createIdentity,
  updateIdentity,
  deleteIdentity,
} from '../commands/identity';
import type { CommandContext } from '../commands/types';

function getClients(request: FastifyRequest) {
  return {
    adminClient: adminSupabase,
    userClient: request.supabase,
  };
}

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

        const clients = getClients(request);
        const identities = identityService
          .scoped(clients)
          .getIdentitiesByUser(userId);
        reply.send({ identities });
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to fetch identities' });
      }
    },
  );

  fastify.get<{ Params: IdentityParams }>(
    '/api/identities/:identityId',
    {
      preHandler: [fastify.authenticate],
    },
    async (
      request: FastifyRequest<{ Params: IdentityParams }>,
      reply: FastifyReply,
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { identityId } = request.params;
        const clients = getClients(request);
        const identity = identityService
          .admin(clients)
          .getIdentityById(identityId);

        if (!identity) {
          reply.code(404).send({ error: 'Identity not found' });
          return;
        }

        reply.send({ identity });
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to fetch identity' });
      }
    },
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
      reply: FastifyReply,
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const clients = getClients(request);
        const existing = await identityService
          .admin(clients)
          .getIdentityByProviderUserId(
            request.body.provider || 'whatsapp',
            request.body.provider_user_id,
          );

        if (existing) {
          reply
            .code(409)
            .send({ error: 'Identity already exists for this provider user' });
          return;
        }

        const context: CommandContext = {
          eventEmitter: fastify.eventEmitter,
        };

        const result = await createIdentity(
          clients,
          {
            userId,
            provider: request.body.provider,
            provider_user_id: request.body.provider_user_id,
            metadata: request.body.metadata,
          },
          context,
        );

        reply.send({ identity: result.identity });
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to create identity' });
      }
    },
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
      reply: FastifyReply,
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { identityId } = request.params;
        const clients = getClients(request);

        const context: CommandContext = {
          eventEmitter: fastify.eventEmitter,
        };

        const result = await updateIdentity(
          clients,
          {
            userId,
            identityId,
            provider: request.body.provider,
            provider_user_id: request.body.provider_user_id,
            metadata: request.body.metadata,
          },
          context,
        );

        reply.send({ identity: result.identity });
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to update identity' });
      }
    },
  );

  fastify.delete<{ Params: IdentityParams }>(
    '/api/identities/:identityId',
    {
      preHandler: [fastify.authenticate],
    },
    async (
      request: FastifyRequest<{ Params: IdentityParams }>,
      reply: FastifyReply,
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { identityId } = request.params;
        const clients = getClients(request);

        const context: CommandContext = {
          eventEmitter: fastify.eventEmitter,
        };

        await deleteIdentity(clients, { userId, identityId }, context);

        reply.code(204).send();
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to delete identity' });
      }
    },
  );
}
