import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { externalPlatformService } from '../services/external-platform.service';
import { createUserClient } from '../clients/supabase.client';

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

function getUserClient(request: FastifyRequest) {
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    throw new Error('Missing authorization header');
  }
  const token = authHeader.replace('Bearer ', '');
  return createUserClient(token);
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

        const userClient = getUserClient(request);
        const platforms = await externalPlatformService.getPlatformsByUser(
          userClient,
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
        const userClient = getUserClient(request);
        const platform = await externalPlatformService.getPlatformByOwnerAndId(
          userClient,
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

        const userClient = getUserClient(request);
        const platform = await externalPlatformService.createPlatform(
          userClient,
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
        const userClient = getUserClient(request);
        const platform = await externalPlatformService.updatePlatform(
          userClient,
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
        const userClient = getUserClient(request);
        await externalPlatformService.deletePlatform(
          userClient,
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
