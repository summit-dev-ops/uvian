import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { agentConfigService } from '../services/agent-config.service';

export default async function agentLlmRoutes(fastify: FastifyInstance) {
  fastify.post<{
    Params: { agentId: string };
    Body: {
      llmId: string;
      secretName?: string;
      secretValue?: string;
      isDefault?: boolean;
    };
  }>(
    '/api/config/agents/:agentId/llms',
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
          required: ['llmId'],
          properties: {
            llmId: { type: 'string' },
            secretName: { type: 'string' },
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
        const { agentId } = request.params as any as { agentId: string };
        const body = request.body as any;

        const link = await agentConfigService.linkLlm(userClient, agentId, {
          llmId: body.llmId,
          secretName: body.secretName,
          secretValue: body.secretValue,
          isDefault: body.isDefault,
        });

        return reply.code(201).send({ link });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  fastify.put<{
    Params: { agentId: string; llmId: string };
    Body: {
      secretValue?: string;
      isDefault?: boolean;
    };
  }>(
    '/api/config/agents/:agentId/llms/:llmId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['agentId', 'llmId'],
          properties: {
            agentId: { type: 'string' },
            llmId: { type: 'string' },
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
        const { agentId, llmId } = request.params as any as {
          agentId: string;
          llmId: string;
        };
        const body = request.body as any;

        const link = await agentConfigService.updateLlmLink(
          userClient,
          agentId,
          llmId,
          {
            secretValue: body.secretValue,
            isDefault: body.isDefault,
          }
        );

        return reply.send({ link });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  fastify.delete<{
    Params: { agentId: string; llmId: string };
  }>(
    '/api/config/agents/:agentId/llms/:llmId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['agentId', 'llmId'],
          properties: {
            agentId: { type: 'string' },
            llmId: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userClient = await request.supabase;
        const { agentId, llmId } = request.params as any as {
          agentId: string;
          llmId: string;
        };

        await agentConfigService.unlinkLlm(userClient, agentId, llmId);
        return reply.send({ success: true });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );
}
