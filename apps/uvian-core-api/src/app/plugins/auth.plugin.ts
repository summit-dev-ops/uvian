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
    authenticate: (request: any, reply: any) => Promise<void>;
    authenticateOptional: (request: any, reply: any) => Promise<void>;
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
    } catch (error: any) {
      fastify.log.error('Authentication error:', error);
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
    } catch (error: any) {
      request.supabase = createAnonClient();
    }
  });

  fastify.addHook('preHandler', async (request: any, reply: any) => {
    if (
      !request.url.startsWith('/api/') ||
      request.url === '/api/health' ||
      request.url === '/'
    ) {
      return;
    }

    if (request.headers['x-api-key']) {
      return;
    }

    const publicEndpoints: string[] = [];
    const isPublicEndpoint = publicEndpoints.some((endpoint) =>
      request.url.startsWith(endpoint)
    );

    if (!isPublicEndpoint) {
      await (fastify as any).authenticate(request, reply);
    } else {
      await (fastify as any).authenticateOptional(request, reply);
    }
  });
});
