import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { adminSupabase } from '../clients/supabase.client';
import { llmService, secretsService } from '../services';
import { createLlm, updateLlm, deleteLlm } from '../commands';

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

export default async function llmRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/config/llms',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const accountId = await getAccountIdFromRequest(request);
        const clients = {
          adminClient: adminSupabase,
          userClient: request.supabase,
        };
        const llms = await llmService.scoped(clients).list(accountId);
        return reply.send({ llms });
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    },
  );

  fastify.post(
    '/api/config/llms',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['name', 'type', 'provider', 'modelName'],
          properties: {
            name: { type: 'string' },
            type: { type: 'string' },
            provider: { type: 'string' },
            modelName: { type: 'string' },
            baseUrl: { type: 'string' },
            temperature: { type: 'number' },
            maxTokens: { type: 'number' },
            maxContextSize: { type: 'number' },
            config: { type: 'object' },
            isDefault: { type: 'boolean' },
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
        const body = request.body as any;
        const { llm } = await createLlm(clients, { ...body }, {
          eventEmitter: fastify.eventEmitter, userId: request.user?.id
        });
        return reply.code(201).send({ llm });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    },
  );

  fastify.put(
    '/api/config/llms/:llmId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['llmId'],
          properties: { llmId: { type: 'string' } },
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string' },
            provider: { type: 'string' },
            modelName: { type: 'string' },
            baseUrl: { type: 'string' },
            temperature: { type: 'number' },
            maxTokens: { type: 'number' },
            maxContextSize: { type: 'number' },
            config: { type: 'object' },
            isActive: { type: 'boolean' },
            isDefault: { type: 'boolean' },
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
        const { llmId } = request.params as any as { llmId: string };
        const { llm } = await updateLlm(
          clients,
          { llmId, ...(request.body as any) },
          { eventEmitter: fastify.eventEmitter, userId: request.user?.id },
        );
        return reply.send({ llm });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    },
  );

  fastify.delete(
    '/api/config/llms/:llmId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['llmId'],
          properties: { llmId: { type: 'string' } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const clients = {
          adminClient: adminSupabase,
          userClient: request.supabase,
        };
        const { llmId } = request.params as any as { llmId: string };
        await deleteLlm(
          clients,
          { llmId },
          { eventEmitter: fastify.eventEmitter, userId: request.user?.id },
        );
        return reply.send({ success: true });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    },
  );
}
