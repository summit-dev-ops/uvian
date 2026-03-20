import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { mcpService } from '../services/mcp.service';

export default async function mcpRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/config/mcps/:accountId',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { accountId } = request.params as any as { accountId: string };
        const userClient = await request.supabase;
        const mcps = await mcpService.list(userClient, accountId);
        return reply.send({ mcps });
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    }
  );

  fastify.post(
    '/api/config/mcps',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['accountId', 'name', 'type', 'authMethod'],
          properties: {
            accountId: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string' },
            url: { type: 'string' },
            authMethod: { type: 'string' },
            config: { type: 'object' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userClient = await request.supabase;
        const mcp = await mcpService.create(userClient, request.body as any);
        return reply.code(201).send({ mcp });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  fastify.put(
    '/api/config/mcps/:mcpId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['mcpId'],
          properties: { mcpId: { type: 'string' } },
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string' },
            url: { type: 'string' },
            authMethod: { type: 'string' },
            config: { type: 'object' },
            isActive: { type: 'boolean' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userClient = await request.supabase;
        const { mcpId } = request.params as any as { mcpId: string };
        const mcp = await mcpService.update(
          userClient,
          mcpId,
          request.body as any
        );
        return reply.send({ mcp });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  fastify.delete(
    '/api/config/mcps/:mcpId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['mcpId'],
          properties: { mcpId: { type: 'string' } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userClient = await request.supabase;
        const { mcpId } = request.params as any as { mcpId: string };
        await mcpService.delete(userClient, mcpId);
        return reply.send({ success: true });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );
}
