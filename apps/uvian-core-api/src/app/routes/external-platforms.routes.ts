import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { externalPlatformService } from '../services/factory';
import { adminSupabase } from '../clients/supabase.client';

interface PlatformParams {
  platformId: string;
}

interface CreatePlatformBody {
  name: string;
  platform:
    | 'discord'
    | 'slack'
    | 'whatsapp'
    | 'telegram'
    | 'messenger'
    | 'email';
  config?: Record<string, unknown>;
  is_active?: boolean;
}

interface UpdatePlatformBody {
  name?: string;
  platform?:
    | 'discord'
    | 'slack'
    | 'whatsapp'
    | 'telegram'
    | 'messenger'
    | 'email';
  config?: Record<string, unknown>;
  is_active?: boolean;
}

function getClients(request: FastifyRequest) {
  return {
    adminClient: adminSupabase,
    userClient: request.supabase,
  };
}

export default async function externalPlatformRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/external-platforms',
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
        const platforms = await externalPlatformService.getPlatformsByUser(
          clients,
          userId
        );
        reply.send({ platforms });
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch platforms';
        reply.code(400).send({ error: errorMessage });
      }
    }
  );

  fastify.get<{ Params: PlatformParams }>(
    '/api/external-platforms/:platformId',
    {
      preHandler: [fastify.authenticate],
    },
    async (
      request: FastifyRequest<{ Params: PlatformParams }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { platformId } = request.params;
        const clients = getClients(request);
        const platform = await externalPlatformService.getPlatformByOwnerAndId(
          clients,
          platformId,
          userId
        );

        if (!platform) {
          reply.code(404).send({ error: 'Platform not found' });
          return;
        }

        reply.send({ platform });
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch platform';
        reply.code(400).send({ error: errorMessage });
      }
    }
  );

  fastify.post<{ Body: CreatePlatformBody }>(
    '/api/external-platforms',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['name', 'platform'],
          properties: {
            name: { type: 'string' },
            platform: {
              type: 'string',
              enum: [
                'discord',
                'slack',
                'whatsapp',
                'telegram',
                'messenger',
                'email',
              ],
            },
            config: { type: 'object' },
            is_active: { type: 'boolean' },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: CreatePlatformBody }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const clients = getClients(request);
        const platform = await externalPlatformService.createPlatform(
          clients,
          userId,
          request.body
        );

        reply.code(201).send({ platform });
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to create platform';
        reply.code(400).send({ error: errorMessage });
      }
    }
  );

  fastify.put<{ Params: PlatformParams; Body: UpdatePlatformBody }>(
    '/api/external-platforms/:platformId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            platform: {
              type: 'string',
              enum: [
                'discord',
                'slack',
                'whatsapp',
                'telegram',
                'messenger',
                'email',
              ],
            },
            config: { type: 'object' },
            is_active: { type: 'boolean' },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: PlatformParams;
        Body: UpdatePlatformBody;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { platformId } = request.params;
        const clients = getClients(request);
        const platform = await externalPlatformService.updatePlatform(
          clients,
          userId,
          platformId,
          request.body
        );

        reply.send({ platform });
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update platform';
        reply.code(400).send({ error: errorMessage });
      }
    }
  );

  fastify.delete<{ Params: PlatformParams }>(
    '/api/external-platforms/:platformId',
    {
      preHandler: [fastify.authenticate],
    },
    async (
      request: FastifyRequest<{ Params: PlatformParams }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { platformId } = request.params;
        const clients = getClients(request);
        await externalPlatformService.deletePlatform(
          clients,
          userId,
          platformId
        );

        reply.code(204).send();
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to delete platform';
        reply.code(400).send({ error: errorMessage });
      }
    }
  );
}
