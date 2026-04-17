import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { adminSupabase } from '../clients/supabase.client';

export default async function agentHookRoutes(fastify: FastifyInstance) {
  fastify.get<{
    Params: { agentId: string };
  }>(
    '/api/agents/:agentId/hooks',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { agentId } = request.params as any as { agentId: string };

        const { data, error } = await adminSupabase
          .schema('core_automation')
          .from('v_agent_hooks_for_worker')
          .select('*')
          .eq('agent_id', agentId);

        if (error) throw new Error(error.message);

        return reply.send({ hooks: data || [] });
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    },
  );
}
