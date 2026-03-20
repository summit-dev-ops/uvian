import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { agentConfigService } from '../services/agent-config.service';

export default async function agentMcpRoutes(fastify: FastifyInstance) {
  fastify.post<{
    Params: { agentId: string };
    Body: {
      mcpId: string;
      secretName?: string;
      secretValue?: string;
      secretType?: string;
    };
  }>(
    '/api/config/agents/:agentId/mcps',
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
          required: ['mcpId'],
          properties: {
            mcpId: { type: 'string' },
            secretName: { type: 'string' },
            secretValue: { type: 'string' },
            secretType: {
              type: 'string',
              enum: ['api_key', 'bearer', 'jwt', 'api_key_json'],
            },
          },
          additionalProperties: false,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userClient = await request.supabase;
        const { agentId } = request.params as any as { agentId: string };
        const body = request.body as any;

        const link = await agentConfigService.linkMcp(userClient, agentId, {
          mcpId: body.mcpId,
          secretName: body.secretName,
          secretValue: body.secretValue,
          secretType: body.secretType,
        });

        return reply.code(201).send({ link });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  fastify.put<{
    Params: { agentId: string; mcpId: string };
    Body: {
      secretValue?: string;
      isDefault?: boolean;
    };
  }>(
    '/api/config/agents/:agentId/mcps/:mcpId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['agentId', 'mcpId'],
          properties: {
            agentId: { type: 'string' },
            mcpId: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            secretValue: { type: 'string' },
            isDefault: { type: 'boolean' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userClient = await request.supabase;
        const { agentId, mcpId } = request.params as any as {
          agentId: string;
          mcpId: string;
        };
        const body = request.body as any;

        const link = await agentConfigService.updateMcpLink(
          userClient,
          agentId,
          mcpId,
          { secretValue: body.secretValue, isDefault: body.isDefault }
        );

        return reply.send({ link });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  fastify.delete<{
    Params: { agentId: string; mcpId: string };
  }>(
    '/api/config/agents/:agentId/mcps/:mcpId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['agentId', 'mcpId'],
          properties: {
            agentId: { type: 'string' },
            mcpId: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userClient = await request.supabase;
        const { agentId, mcpId } = request.params as any as {
          agentId: string;
          mcpId: string;
        };

        await agentConfigService.unlinkMcp(userClient, agentId, mcpId);
        return reply.send({ success: true });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );
}
