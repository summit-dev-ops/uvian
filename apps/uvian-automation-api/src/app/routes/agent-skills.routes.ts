import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { adminSupabase } from '../clients/supabase.client';
import { agentConfigService } from '../services';

export default async function agentSkillRoutes(fastify: FastifyInstance) {
  fastify.get<{
    Params: { agentId: string };
  }>(
    '/api/config/agents/:agentId/skills',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const clients = {
          adminClient: adminSupabase,
          userClient: request.supabase,
        };
        const { agentId } = request.params as any as { agentId: string };
        const skills = await agentConfigService
          .scoped(clients)
          .getSkills(agentId);
        return reply.send({ skills });
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    }
  );

  fastify.post<{
    Params: { agentId: string };
    Body: {
      skillId: string;
    };
  }>(
    '/api/config/agents/:agentId/skills',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['agentId'],
          properties: { agentId: { type: 'string' } },
        },
        body: {
          type: 'object',
          required: ['skillId'],
          properties: {
            skillId: { type: 'string' },
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
        const { agentId } = request.params as any as { agentId: string };
        const body = request.body as any;

        const link = await agentConfigService
          .scoped(clients)
          .linkSkill(agentId, {
            skillId: body.skillId,
          });

        return reply.code(201).send({ link });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  fastify.delete<{
    Params: { agentId: string; skillId: string };
  }>(
    '/api/config/agents/:agentId/skills/:skillId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['agentId', 'skillId'],
          properties: {
            agentId: { type: 'string' },
            skillId: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const clients = {
          adminClient: adminSupabase,
          userClient: request.supabase,
        };
        const { agentId, skillId } = request.params as any as {
          agentId: string;
          skillId: string;
        };

        await agentConfigService.scoped(clients).unlinkSkill(agentId, skillId);
        return reply.send({ success: true });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );
}
