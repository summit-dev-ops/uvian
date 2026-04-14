import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { agentService } from '../services/factory';
import { adminSupabase } from '../clients/supabase.client';
import { createAgent, deleteAgent } from '../commands/agent';

interface GetAgentsParams {
  accountId: string;
}

interface CreateAgentParams {
  accountId: string;
}

interface CreateAgentBody {
  name: string;
}

interface GetAgentParams {
  accountId: string;
  agentId: string;
}

interface DeleteAgentParams {
  accountId: string;
  agentId: string;
}

function getClients(request: FastifyRequest) {
  return {
    adminClient: adminSupabase,
    userClient: request.supabase,
  };
}

export default async function accountRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: GetAgentsParams }>(
    '/api/accounts/:accountId/agents',
    {
      preHandler: [fastify.authenticate],
    },
    async (
      request: FastifyRequest<{ Params: GetAgentsParams }>,
      reply: FastifyReply,
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { accountId } = request.params;
        const clients = getClients(request);

        const agents = await agentService.scoped(clients).getAgents(accountId);
        reply.send({ agents });
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to fetch agents' });
      }
    },
  );

  fastify.post<{ Params: CreateAgentParams; Body: CreateAgentBody }>(
    '/api/accounts/:accountId/agents',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: CreateAgentParams;
        Body: CreateAgentBody;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { accountId } = request.params;

        const { name } = request.body;
        const clients = getClients(request);
        const result = await createAgent(clients, { userId, accountId, name });
        reply.code(201).send({ agent: result.agent });
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to create agent' });
      }
    },
  );

  fastify.get<{ Params: GetAgentParams }>(
    '/api/accounts/:accountId/agents/:agentId',
    {
      preHandler: [fastify.authenticate],
    },
    async (
      request: FastifyRequest<{ Params: GetAgentParams }>,
      reply: FastifyReply,
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { accountId, agentId } = request.params;
        const clients = getClients(request);

        const agent = await agentService
          .scoped(clients)
          .getAgent(agentId, accountId);

        if (!agent) {
          reply.code(404).send({ error: 'Agent not found' });
          return;
        }

        reply.send({ agent });
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to fetch agent' });
      }
    },
  );

  fastify.delete<{ Params: DeleteAgentParams }>(
    '/api/accounts/:accountId/agents/:agentId',
    {
      preHandler: [fastify.authenticate],
    },
    async (
      request: FastifyRequest<{ Params: DeleteAgentParams }>,
      reply: FastifyReply,
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { accountId, agentId } = request.params;
        const clients = getClients(request);

        await deleteAgent(clients, { userId, agentId, accountId });
        reply.code(204).send();
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to delete agent' });
      }
    },
  );
}
