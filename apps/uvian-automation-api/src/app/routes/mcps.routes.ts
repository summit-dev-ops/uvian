import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { adminSupabase } from '../clients/supabase.client';
import { mcpService, secretsService } from '../services';
import { createMcp, updateMcp, deleteMcp } from '../commands';

async function getAccountIdFromRequest(request: FastifyRequest): Promise<string> {
  const userId = request.user?.id;
  if (!userId) throw new Error('User not authenticated');
  const clients = {
    adminClient: adminSupabase,
    userClient: request.supabase,
  };
  const accountId = await secretsService.admin(clients).getAccountIdForUser(userId);
  if (!accountId) throw new Error('User does not have an account');
  return accountId;
}

export default async function mcpRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/config/mcps',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const accountId = await getAccountIdFromRequest(request);
        const clients = {
          adminClient: adminSupabase,
          userClient: request.supabase,
        };
        const mcps = await mcpService.scoped(clients).list(accountId);
        return reply.send({ mcps });
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    },
  );

  fastify.post(
    '/api/config/mcps',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['name', 'type', 'authMethod'],
          properties: {
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
        const accountId = await getAccountIdFromRequest(request);
        const clients = {
          adminClient: adminSupabase,
          userClient: request.supabase,
        };
        const body = request.body as any;
        const { mcp } = await createMcp(clients, { ...body, accountId });
        return reply.code(201).send({ mcp });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    },
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
        const clients = {
          adminClient: adminSupabase,
          userClient: request.supabase,
        };
        const { mcpId } = request.params as any as { mcpId: string };
        const { mcp } = await updateMcp(clients, {
          mcpId,
          ...(request.body as any),
        });
        return reply.send({ mcp });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    },
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
        const clients = {
          adminClient: adminSupabase,
          userClient: request.supabase,
        };
        const { mcpId } = request.params as any as { mcpId: string };
        await deleteMcp(clients, { mcpId });
        return reply.send({ success: true });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    },
  );
}
