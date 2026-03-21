import fp from 'fastify-plugin';
import { FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    authenticateInternal: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}

export default fp(async (fastify) => {
  const internalApiKey = process.env.SECRET_INTERNAL_API_KEY;

  fastify.decorate(
    'authenticateInternal',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const providedKey = request.headers['x-api-key'];
      if (
        !providedKey ||
        typeof providedKey !== 'string' ||
        providedKey !== internalApiKey
      ) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
    }
  );
});
