import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { adminSupabase } from '../clients/supabase.client';
import { hookService } from '../services';
import {
  CreateHookRequest,
  GetHooksRequest,
  GetHookRequest,
  UpdateHookRequest,
  DeleteHookRequest,
  LinkHookToAgentRequest,
  UnlinkHookFromAgentRequest,
} from '../types/hook.types';

export default async function (fastify: FastifyInstance) {
  fastify.post<CreateHookRequest>(
    '/api/hooks',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['accountId', 'name', 'triggerJson', 'action'],
          properties: {
            accountId: { type: 'string' },
            name: { type: 'string' },
            triggerJson: { type: 'object' },
            action: { type: 'string', enum: ['interrupt', 'log', 'block'] },
            config: { type: 'object' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request: FastifyRequest<CreateHookRequest>, reply: FastifyReply) => {
      try {
        const body = request.body || {};
        const { accountId, name, triggerJson, action, config } = body;

        const clients = {
          adminClient: adminSupabase,
          userClient: request.supabase,
        };
        const result = await hookService.scoped(clients).create({
          accountId,
          name,
          triggerJson,
          action,
          config,
        });

        reply.code(201).send(result);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to create hook' });
      }
    },
  );

  fastify.get<GetHooksRequest>(
    '/api/hooks',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<GetHooksRequest>, reply: FastifyReply) => {
      try {
        const query = request.query || {};

        const clients = {
          adminClient: adminSupabase,
          userClient: request.supabase,
        };
        const result = await hookService.scoped(clients).list({
          isActive: query.isActive,
        });

        reply.send(result);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to fetch hooks' });
      }
    },
  );

  fastify.get<GetHookRequest>(
    '/api/hooks/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          additionalProperties: false,
        },
      },
    },
    async (request: FastifyRequest<GetHookRequest>, reply: FastifyReply) => {
      try {
        const { id } = request.params;

        const clients = {
          adminClient: adminSupabase,
          userClient: request.supabase,
        };
        const hook = await hookService.scoped(clients).get(id);

        if (!hook) {
          reply.code(404).send({ error: 'Hook not found' });
          return;
        }

        reply.send(hook);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to fetch hook' });
      }
    },
  );

  fastify.patch<UpdateHookRequest>(
    '/api/hooks/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          additionalProperties: false,
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            triggerJson: { type: 'object' },
            action: { type: 'string', enum: ['interrupt', 'log', 'block'] },
            config: { type: 'object' },
            isActive: { type: 'boolean' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request: FastifyRequest<UpdateHookRequest>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const updates = request.body || {};

        const clients = {
          adminClient: adminSupabase,
          userClient: request.supabase,
        };
        const hook = await hookService.scoped(clients).update(id, {
          name: updates.name,
          triggerJson: updates.triggerJson,
          action: updates.action as 'interrupt' | 'log' | 'block',
          config: updates.config,
          isActive: updates.isActive,
        });

        reply.send(hook);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to update hook' });
      }
    },
  );

  fastify.delete<DeleteHookRequest>(
    '/api/hooks/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          additionalProperties: false,
        },
      },
    },
    async (request: FastifyRequest<DeleteHookRequest>, reply: FastifyReply) => {
      try {
        const { id } = request.params;

        const clients = {
          adminClient: adminSupabase,
          userClient: request.supabase,
        };
        await hookService.scoped(clients).delete(id);

        reply.code(204).send();
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to delete hook' });
      }
    },
  );

  fastify.post<LinkHookToAgentRequest>(
    '/api/hooks/:id/agents/:agentId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            agentId: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<LinkHookToAgentRequest>,
      reply: FastifyReply,
    ) => {
      try {
        const { id, agentId } = request.params;

        const clients = {
          adminClient: adminSupabase,
          userClient: request.supabase,
        };
        await hookService.scoped(clients).linkToAgent(id, agentId);

        reply.code(201).send({ success: true });
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to link hook to agent' });
      }
    },
  );

  fastify.delete<UnlinkHookFromAgentRequest>(
    '/api/hooks/:id/agents/:agentId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            agentId: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<UnlinkHookFromAgentRequest>,
      reply: FastifyReply,
    ) => {
      try {
        const { id, agentId } = request.params;

        const clients = {
          adminClient: adminSupabase,
          userClient: request.supabase,
        };
        await hookService.scoped(clients).unlinkFromAgent(id, agentId);

        reply.code(204).send();
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to unlink hook from agent' });
      }
    },
  );
}
