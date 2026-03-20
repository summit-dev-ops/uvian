import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { secretsService } from '../services/secrets.service';

export default async function secretsRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/config/secrets/:accountId',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { accountId } = request.params as any as { accountId: string };
        const userClient = await request.supabase;
        const secrets = await secretsService.list(userClient, accountId);
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
          required: ['accountId', 'name', 'secretType', 'value'],
          properties: {
            accountId: { type: 'string' },
            name: { type: 'string' },
            secretType: {
              type: 'string',
              enum: ['api_key', 'bearer', 'jwt', 'api_key_json'],
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
        const userClient = await request.supabase;
        const secret = await secretsService.create(
          userClient,
          request.body as any
        );
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
        const userClient = await request.supabase;
        const { secretId } = request.params as any as { secretId: string };
        const secret = await secretsService.update(
          userClient,
          secretId,
          request.body as any
        );
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
        const userClient = await request.supabase;
        const { secretId } = request.params as any as { secretId: string };
        await secretsService.delete(userClient, secretId);
        return reply.send({ success: true });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );
}
