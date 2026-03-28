import fp from 'fastify-plugin';
import { createAnonClient, createUserClient } from '../clients/supabase.client';
import { SupabaseClient } from '@supabase/supabase-js';

declare module 'fastify' {
  interface FastifyRequest {
    supabase: SupabaseClient;
    user?: {
      id: string;
      email?: string;
      user_metadata?: unknown;
    };
  }

  interface FastifyInstance {
    addSchema(schema: unknown): FastifyInstance;
  }
}

export default fp(async (fastify) => {
  function extractToken(authHeader: string | undefined): string | null {
    if (!authHeader) return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    return parts[1];
  }

  fastify.decorate('authenticate', async (request: any, reply: any) => {
    try {
      const token = extractToken(request.headers.authorization);

      if (!token) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'No authorization token provided',
        });
      }

      const scopedClient = createUserClient(token);

      const {
        data: { user },
        error,
      } = await scopedClient.auth.getUser();

      if (error || !user) {
        throw new Error('Invalid token');
      }

      request.supabase = scopedClient;
      request.user = {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
      };
    } catch (error: unknown) {
      fastify.log.error(error, 'Authentication error');
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }
  });

  fastify.decorate('authenticateOptional', async (request: any, reply: any) => {
    try {
      const token = extractToken(request.headers.authorization);

      if (token) {
        const scopedClient = createUserClient(token);
        const {
          data: { user },
          error,
        } = await scopedClient.auth.getUser();

        if (!error && user) {
          request.supabase = scopedClient;
          request.user = {
            id: user.id,
            email: user.email,
            user_metadata: user.user_metadata,
          };
          return;
        }
      }

      request.supabase = createAnonClient();
    } catch {
      request.supabase = createAnonClient();
    }
  });

  fastify.addHook('preHandler', async (request: any, reply: any) => {
    if (!request.url.startsWith('/api/')) {
      return;
    }

    const publicEndpoints = ['/api/public/'];
    const isPublicEndpoint = publicEndpoints.some((endpoint) =>
      request.url.startsWith(endpoint)
    );

    if (!isPublicEndpoint) {
      await fastify.authenticate(request, reply);
    } else {
      await fastify.authenticateOptional(request, reply);
    }
  });
});
