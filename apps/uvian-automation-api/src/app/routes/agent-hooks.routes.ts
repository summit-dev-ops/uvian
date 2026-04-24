import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { adminSupabase, createUserClient } from '../clients/supabase.client';
import { agentConfigService } from '../services';

function getClients(request: FastifyRequest) {
  const authHeader = request.headers.authorization as string | undefined;
  const userClient = authHeader
    ? createUserClient(authHeader.replace('Bearer ', ''))
    : adminSupabase;
  return {
    adminClient: adminSupabase,
    userClient,
  };
}

export default async function agentHookRoutes(fastify: FastifyInstance) {
  fastify.get<{
    Params: { agentUserId: string };
  }>(
    '/api/agents/:agentUserId/hooks',
    { preHandler: [fastify.authenticateInternal] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { agentUserId } = request.params as any as { agentUserId: string };

        // Use same getClients() pattern as skills route
        const clients = getClients(request);

        const agent = await agentConfigService
          .scoped(clients)
          .getByUserId(agentUserId);

        if (!agent) {
          return reply.code(404).send({ error: 'Agent not found' });
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