import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { agentConfigService } from '../services/agent-config.service.js';
import { accountService } from '../services/account.service.js';
import {
  CreateAgentRequest,
  GetAgentsRequest,
  GetAgentRequest,
  UpdateAgentRequest,
  DeleteAgentRequest,
  AVAILABLE_EVENT_TYPES,
} from '../types/agent-config.types.js';

export default async function agentRoutes(fastify: FastifyInstance) {
  fastify.get<GetAgentsRequest>(
    '/api/accounts/:accountId/agents',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest<GetAgentsRequest>, reply: FastifyReply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { accountId } = request.params;
        await accountService.getAccount(accountId, userId);

        const agents = await agentConfigService.getAgentsByAccount(
          request.supabase,
          accountId
        );
        reply.send({ agents });
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to fetch agents' });
      }
    }
  );

  fastify.get<GetAgentRequest>(
    '/api/accounts/:accountId/agents/:agentId',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest<GetAgentRequest>, reply: FastifyReply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { accountId, agentId } = request.params;
        await accountService.getAccount(accountId, userId);

        const agent = await agentConfigService.getAgentById(
          request.supabase,
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

  fastify.post<CreateAgentRequest>(
    '/api/accounts/:accountId/agents',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            subscribed_events: {
              type: 'array',
              items: { type: 'string', enum: AVAILABLE_EVENT_TYPES },
            },
            config: { type: 'object' },
            is_active: { type: 'boolean' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<CreateAgentRequest>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { accountId } = request.params;
        await accountService.getAccount(accountId, userId);

        const agent = await agentConfigService.createAgent(
          accountId,
          userId,
          request.body
        );
        reply.send({ agent });
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to create agent' });
      }
    }
  );

  fastify.put<UpdateAgentRequest>(
    '/api/accounts/:accountId/agents/:agentId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            subscribed_events: {
              type: 'array',
              items: { type: 'string', enum: AVAILABLE_EVENT_TYPES },
            },
            config: { type: 'object' },
            is_active: { type: 'boolean' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<UpdateAgentRequest>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { accountId, agentId } = request.params;
        await accountService.getAccount(accountId, userId);

        const agent = await agentConfigService.updateAgent(
          agentId,
          accountId,
          request.body
        );
        reply.send({ agent });
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to update agent' });
      }
    }
  );

  fastify.delete<DeleteAgentRequest>(
    '/api/accounts/:accountId/agents/:agentId',
    {
      preHandler: [fastify.authenticate],
    },
    async (
      request: FastifyRequest<DeleteAgentRequest>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { accountId, agentId } = request.params;
        await accountService.getAccount(accountId, userId);

        await agentConfigService.deleteAgent(agentId, accountId);
        reply.code(204).send();
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to delete agent' });
      }
    }
  );
}
