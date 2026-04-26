import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { secretsService } from '../services';
import { adminSupabase } from '../clients/supabase.client';

function getClients(request: FastifyRequest) {
  return {
    adminClient: adminSupabase,
    userClient: request.supabase,
  };
}

async function getAccountIdForRequest(
  request: FastifyRequest
): Promise<string> {
  const clients = getClients(request);
  const userId = request.user?.id;
  if (!userId) throw new Error('User not authenticated');
  const accountId = await secretsService
    .admin(clients)
    .getAccountIdForUser(userId);
  if (!accountId) throw new Error('User does not have an account');
  return accountId;
}

export default async function secretsRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/config/secrets',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const accountId = await getAccountIdForRequest(request);
        const clients = getClients(request);
        const secrets = await secretsService.scoped(clients).list(accountId);
        return reply.send({ secrets });
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    }
  );

  fastify.post(
    '/api/config/secrets',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['name', 'valueType', 'value'],
          properties: {
            name: { type: 'string' },
            valueType: {
              type: 'string',
              enum: ['text', 'json'],
            },
            value: { type: 'string' },
            metadata: { type: 'object' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const accountId = await getAccountIdForRequest(request);
        const clients = getClients(request);
        const { name, valueType, value, metadata } = request.body as any;
        const secret = await secretsService
          .scoped(clients)
          .create(accountId, { name, valueType, value, metadata });
        return reply.code(201).send({ secret });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  fastify.put(
    '/api/config/secrets/:secretId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['secretId'],
          properties: { secretId: { type: 'string' } },
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            value: { type: 'string' },
            metadata: { type: 'object' },
            isActive: { type: 'boolean' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const clients = getClients(request);
        const { secretId } = request.params as any as { secretId: string };
        const accountId = await getAccountIdForRequest(request);
        const secret = await secretsService
          .scoped(clients)
          .update(accountId, secretId, request.body as any);
        return reply.send({ secret });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  fastify.delete(
    '/api/config/secrets/:secretId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['secretId'],
          properties: { secretId: { type: 'string' } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const clients = getClients(request);
        const { secretId } = request.params as any as { secretId: string };
        const accountId = await getAccountIdForRequest(request);
        await secretsService.scoped(clients).delete(accountId, secretId);
        return reply.send({ success: true });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );
}
