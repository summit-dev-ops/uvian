import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { agentService } from '../services/agent.service';
import { createUserClient } from '../clients/supabase.client';

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

function getUserClient(request: FastifyRequest) {
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    throw new Error('Missing authorization header');
  }
  const token = authHeader.replace('Bearer ', '');
  return createUserClient(token);
}

export default async function accountRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: GetAgentsParams }>(
    '/api/accounts/:accountId/agents',
    {
      preHandler: [fastify.authenticate],
    },
    async (
      request: FastifyRequest<{ Params: GetAgentsParams }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { accountId } = request.params;
        const userClient = getUserClient(request);

        const agents = await agentService.getAgents(userClient, accountId);
        reply.send({ agents });
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to fetch agents' });
      }
    }
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
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { accountId } = request.params;
        const userClient = getUserClient(request);

        const { name } = request.body;
        const agent = await agentService.createAgent(
          userClient,
          userId,
          accountId,
          name
        );
        reply.code(201).send({ agent });
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to create agent' });
      }
    }
  );

  fastify.get<{ Params: GetAgentParams }>(
    '/api/accounts/:accountId/agents/:agentId',
    {
      preHandler: [fastify.authenticate],
    },
    async (
      request: FastifyRequest<{ Params: GetAgentParams }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { accountId, agentId } = request.params;
        const userClient = getUserClient(request);

        const agent = await agentService.getAgent(
          userClient,
          agentId,
          accountId
        );

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
    }
  );

  fastify.delete<{ Params: DeleteAgentParams }>(
    '/api/accounts/:accountId/agents/:agentId',
    {
      preHandler: [fastify.authenticate],
    },
    async (
      request: FastifyRequest<{ Params: DeleteAgentParams }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { accountId, agentId } = request.params;
        const userClient = getUserClient(request);

        await agentService.deleteAgent(userClient, userId, agentId, accountId);
        reply.code(204).send();
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to delete agent' });
      }
    }
  );
}
