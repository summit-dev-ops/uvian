import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { adminSupabase } from '../clients/supabase.client';
import { agentConfigService } from '../services/agent-config.service';

export default async function agentConfigRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: { agentUserId: string } }>(
    '/api/agents/:agentUserId/secrets',
    { preHandler: [fastify.authenticateInternal] },
    async (request, reply) => {
      try {
        const { agentUserId } = request.params;
        const clients = {
          adminClient: adminSupabase,
          userClient: adminSupabase,
        };
        const secrets = await agentConfigService.getAgentSecrets(
          clients,
          agentUserId
        );
        return reply.send(secrets);
      } catch (error: any) {
        fastify.log.error(error);
        return reply
          .code(500)
          .send({ error: error.message || 'Failed to fetch agent secrets' });
      }
    }
  );

  fastify.get(
    '/api/config/agents/:agentUserId',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const clients = {
          adminClient: adminSupabase,
          userClient: request.supabase,
        };
        const { agentUserId } = request.params as any as {
          agentUserId: string;
        };
        const agent = await agentConfigService.getByUserId(
          clients,
          agentUserId
        );
        if (!agent)
          return reply.code(404).send({ error: 'Agent config not found' });

        const [llms, mcps] = await Promise.all([
          agentConfigService.getLlms(clients, agent.id),
          agentConfigService.getMcps(clients, agent.id),
        ]);

        return reply.send({ agent, llms, mcps });
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    }
  );

  fastify.post(
    '/api/config/agents',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['userId', 'accountId'],
          properties: {
            userId: { type: 'string' },
            accountId: { type: 'string' },
            systemPrompt: { type: 'string' },
            maxConversationHistory: { type: 'number' },
            skills: { type: 'array', items: { type: 'object' } },
            config: { type: 'object' },
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

        const agent = await agentConfigService.create(clients, {
          userId: body.userId,
          accountId: body.accountId,
          systemPrompt: body.systemPrompt,
          maxConversationHistory: body.maxConversationHistory,
          skills: body.skills,
          config: body.config,
        });

        return reply.code(201).send({ agent });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  fastify.put(
    '/api/config/agents/:agentId',
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
          properties: {
            systemPrompt: { type: 'string' },
            maxConversationHistory: { type: 'number' },
            skills: { type: 'array', items: { type: 'object' } },
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
        const { agentId } = request.params as any as { agentId: string };
        const body = request.body as any;

        const agent = await agentConfigService.update(clients, agentId, {
          systemPrompt: body.systemPrompt,
          maxConversationHistory: body.maxConversationHistory,
          skills: body.skills,
          config: body.config,
          isActive: body.isActive,
        });

        return reply.send({ agent });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );
}
