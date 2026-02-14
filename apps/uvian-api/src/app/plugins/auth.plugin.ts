import fp from 'fastify-plugin';
import { createAnonClient, createUserClient } from '../clients/supabase.client';
import { SupabaseClient } from '@supabase/supabase-js';

declare module 'fastify' {
  interface FastifyRequest {
    // We add the RLS-safe client to the request
    supabase: SupabaseClient;
    user?: {
      id: string;
      email?: string;
      user_metadata?: any;
    };
  }

  interface FastifyInstance {
    // Add schema validation options for type providers
    addSchema(schema: any): FastifyInstance;
  }
}

export default fp(async (fastify) => {
  function extractToken(authHeader: string | undefined): string | null {
    if (!authHeader) return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    return parts[1];
  }

  // Authentication middleware
  fastify.decorate('authenticate', async (request: any, reply: any) => {
    try {
      const token = extractToken(request.headers.authorization);

      if (!token) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'No authorization token provided',
        });
      }
      // 1. Create the RLS-enabled client immediately
      const scopedClient = createUserClient(token);

      const {
        data: { user },
        error,
      } = await scopedClient.auth.getUser();

      if (error || !user) {
        throw new Error('Invalid token');
      }

      // 3. Attach both the User and the Client to the request
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

  // Optional authentication
  fastify.decorate('authenticateOptional', async (request: any, reply: any) => {
    try {
      const token = extractToken(request.headers.authorization);

      if (token) {
        // Attempt to create authenticated context
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
          return; // Success, exit
        }
      }

      // Fallback: No token or invalid token
      // We attach an anonymous client so services don't crash when calling request.supabase
      request.supabase = createAnonClient();
      // request.user remains undefined
    } catch (error: any) {
      // Fallback for errors
      request.supabase = createAnonClient();
    }
  });

  // Pre-handler hook (Logic remains mostly the same)
  fastify.addHook('preHandler', async (request: any, reply: any) => {
    if (
      !request.url.startsWith('/api/') ||
      request.url === '/api/health' ||
      request.url === '/'
    ) {
      return;
    }

    const publicEndpoints: string[] = []; // Add public endpoints here
    const isPublicEndpoint = publicEndpoints.some((endpoint) =>
      request.url.startsWith(endpoint)
    );

    if (!isPublicEndpoint) {
      await (fastify as any).authenticate(request, reply);
    } else {
      // Ensure public endpoints still get an anonymous client
      await (fastify as any).authenticateOptional(request, reply);
    }
  });
});
