import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { llmService } from '../services/llm.service';

export default async function llmRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/config/llms/:accountId',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { accountId } = request.params as any as { accountId: string };
        const userClient = await request.supabase;
        const llms = await llmService.list(userClient, accountId);
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
            apiKey: { type: 'string' },
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
        const userClient = await request.supabase;
        const llm = await llmService.create(userClient, request.body as any);
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
            apiKey: { type: 'string' },
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
        const userClient = await request.supabase;
        const { llmId } = request.params as any as { llmId: string };
        const llm = await llmService.update(
          userClient,
          llmId,
          request.body as any
        );
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
        const userClient = await request.supabase;
        const { llmId } = request.params as any as { llmId: string };
        await llmService.delete(userClient, llmId);
        return reply.send({ success: true });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );
}
