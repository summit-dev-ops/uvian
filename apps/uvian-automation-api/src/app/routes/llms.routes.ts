import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { adminSupabase } from '../clients/supabase.client';
import { llmService } from '../services';

export default async function llmRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/config/llms/:accountId',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { accountId } = request.params as any as { accountId: string };
        const clients = {
          adminClient: adminSupabase,
          userClient: request.supabase,
        };
        const llms = await llmService.scoped(clients).list(accountId);
        return reply.send({ llms });
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    }
  );

  fastify.post(
    '/api/config/llms',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['accountId', 'name', 'type', 'provider', 'modelName'],
          properties: {
            accountId: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string' },
            provider: { type: 'string' },
            modelName: { type: 'string' },
            baseUrl: { type: 'string' },
            temperature: { type: 'number' },
            maxTokens: { type: 'number' },
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
        const llm = await llmService
          .scoped(clients)
          .create(request.body as any);
        return reply.code(201).send({ llm });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
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
        const llm = await llmService
          .scoped(clients)
          .update(llmId, request.body as any);
        return reply.send({ llm });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
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
        await llmService.scoped(clients).delete(llmId);
        return reply.send({ success: true });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );
}
