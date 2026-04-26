import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { adminSupabase } from '../clients/supabase.client';
import { skillService, secretsService } from '../services';
import { createSkill, updateSkill, deleteSkill } from '../commands';

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

export default async function skillRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/config/skills',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const accountId = await getAccountIdFromRequest(request);
        const clients = {
          adminClient: adminSupabase,
          userClient: request.supabase,
        };
        const skills = await skillService.scoped(clients).list(accountId);
        return reply.send({ skills });
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    },
  );

  fastify.post(
    '/api/config/skills',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['name', 'description', 'content'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            content: { type: 'object' },
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
        const body = request.body as any;
        const { skill } = await createSkill(
          clients,
          { ...body },
          { eventEmitter: fastify.eventEmitter, userId: request.user?.id },
        );
        return reply.code(201).send({ skill });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    },
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
        const body = request.body as any;
        const { skill } = await updateSkill(
          clients,
          { skillId, ...body },
          { eventEmitter: fastify.eventEmitter, userId: request.user?.id },
        );
        return reply.send({ skill });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    },
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
        await deleteSkill(
          clients,
          { skillId },
          { eventEmitter: fastify.eventEmitter, userId: request.user?.id },
        );
        return reply.send({ success: true });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    },
  );
}
