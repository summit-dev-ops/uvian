import fp from 'fastify-plugin';
import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

declare module 'fastify' {
  interface FastifyInstance {
    authenticateInternal: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }

  interface FastifyRequest {
    userId?: string;
  }
}

export default fp(async (fastify) => {
  const internalApiKey = process.env.SECRET_INTERNAL_API_KEY;

  fastify.decorate(
    'authenticateInternal',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const providedKey = request.headers['x-api-key'];

      if (
        providedKey &&
        typeof providedKey === 'string' &&
        providedKey === internalApiKey
      ) {
        return;
      }

      const authHeader = request.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const jwtSecret = process.env.SUPABASE_JWT_SECRET;

        if (jwtSecret) {
          try {
            const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
            if (decoded.sub && decoded.role === 'authenticated') {
              request.userId = decoded.sub;
              return;
            }
          } catch {
            // Invalid token
          }
        }
      }

      return reply.code(401).send({ error: 'Unauthorized' });
    }
  );
});
