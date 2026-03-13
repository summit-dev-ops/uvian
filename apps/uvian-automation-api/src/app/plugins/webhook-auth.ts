import fp from 'fastify-plugin';
import { FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    authenticateWebhook: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}

export default fp(async (fastify) => {
  const webhookApiKey = process.env.AUTOMATION_API_KEY;

  if (!webhookApiKey) {
    fastify.log.warn(
      'AUTOMATION_API_KEY not set - webhook endpoint will reject all requests'
    );
  }

  fastify.decorate(
    'authenticateWebhook',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const providedKey = request.headers['x-api-key'];

      if (!providedKey) {
        reply.code(401).send({
          error: 'Unauthorized',
          message: 'Missing X-API-Key header',
        });
        return;
      }

      if (typeof providedKey !== 'string') {
        reply.code(401).send({
          error: 'Unauthorized',
          message: 'Invalid X-API-Key header',
        });
        return;
      }

      if (!webhookApiKey || providedKey !== webhookApiKey) {
        reply.code(401).send({
          error: 'Unauthorized',
          message: 'Invalid API key',
        });
        return;
      }
    }
  );
});
