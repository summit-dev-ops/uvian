import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { adminSupabase } from '../clients/supabase.client';
import { skillService } from '../services';

export default async function skillRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/config/skills/:accountId',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { accountId } = request.params as any as { accountId: string };
        const clients = {
          adminClient: adminSupabase,
          userClient: request.supabase,
        };
        const skills = await skillService.scoped(clients).list(accountId);
        return reply.send({ skills });
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    }
  );

  fastify.post(
    '/api/config/skills',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['accountId', 'name', 'description', 'content'],
          properties: {
            accountId: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            content: { type: 'object' },
            autoLoadEvents: { type: 'array', items: { type: 'string' } },
            isPrivate: { type: 'boolean' },
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
        const skill = await skillService
          .scoped(clients)
          .create(request.body as any);
        return reply.code(201).send({ skill });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );
  fastify.put(
    '/api/config/skills/:skillId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['skillId'],
          properties: { skillId: { type: 'string' } },
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            content: { type: 'object' },
            autoLoadEvents: { type: 'array', items: { type: 'string' } },
            isPrivate: { type: 'boolean' },
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
        const { skillId } = request.params as any as { skillId: string };
        const skill = await skillService
          .scoped(clients)
          .update(skillId, request.body as any);
        return reply.send({ skill });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  fastify.delete(
    '/api/config/skills/:skillId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['skillId'],
          properties: { skillId: { type: 'string' } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const clients = {
          adminClient: adminSupabase,
          userClient: request.supabase,
        };
        const { skillId } = request.params as any as { skillId: string };
        await skillService.scoped(clients).delete(skillId);
        return reply.send({ success: true });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );
}
