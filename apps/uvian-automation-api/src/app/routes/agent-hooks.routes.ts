import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { adminSupabase } from '../clients/supabase.client';
import { agentConfigService } from '../services';

export default async function agentHookRoutes(fastify: FastifyInstance) {
  fastify.get<{
    Params: { agentUserId: string };
  }>(
    '/api/agents/:agentUserId/hooks',
    { preHandler: [fastify.authenticateInternal] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { agentUserId } = request.params as any as { agentUserId: string };

        const clients = {
          adminClient: adminSupabase,
          userClient: request.supabase,
        };

        const agent = await agentConfigService
          .scoped(clients)
          .getByUserId(agentUserId);

        if (!agent) {
          return reply.send({ hooks: [] });
        }

        const hooks = await agentConfigService
          .scoped(clients)
          .getHooks(agent.id);

        return reply.send({ hooks });
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    },
  );
}