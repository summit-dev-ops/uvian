import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { configureAgent } from '../services';

export default async function agentBootstrapRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/api/agents/:agentId/config',
    {
      preHandler: [fastify.authenticateInternal],
      schema: {
        params: {
          type: 'object',
          required: ['agentId'],
          properties: { agentId: { type: 'string' } },
          additionalProperties: false,
        },
        body: {
          type: 'object',
          properties: {
            mcps: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name', 'url', 'service'],
                properties: {
                  name: { type: 'string' },
                  url: { type: 'string' },
                  service: { type: 'string' },
                  apiKey: { type: 'string' },
                },
                additionalProperties: false,
              },
            },
            llms: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name', 'type', 'modelName', 'apiKey'],
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string' },
                  modelName: { type: 'string' },
                  baseUrl: { type: 'string' },
                  apiKey: { type: 'string' },
                  temperature: { type: 'number' },
                  maxTokens: { type: 'number' },
                  isDefault: { type: 'boolean' },
                  config: { type: 'object' },
                },
                additionalProperties: false,
              },
            },
          },
          additionalProperties: false,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { agentId } = request.params as { agentId: string };
      const body = request.body as {
        mcps?: Array<{
          name: string;
          url: string;
          service: string;
          apiKey?: string;
        }>;
        llms?: Array<{
          name: string;
          type: string;
          modelName: string;
          baseUrl?: string;
          apiKey: string;
          temperature?: number;
          maxTokens?: number;
          isDefault?: boolean;
          config?: Record<string, unknown>;
        }>;
      };

      try {
        const result = await configureAgent(agentId, {
          mcps: body.mcps,
          llms: body.llms,
        });

        reply.send(result);
      } catch (error: any) {
        console.error('Failed to configure agent:', error);
        reply
          .code(500)
          .send({ error: error.message || 'Failed to configure agent' });
      }
    },
  );
}
