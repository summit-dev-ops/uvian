import fp from 'fastify-plugin';
import { supabase } from '../services/supabase.service';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email?: string;
      user_metadata?: any;
    };
  }
}

export default fp(async (fastify) => {
  // Helper function to extract JWT token from Authorization header
  function extractToken(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  // Helper function to verify JWT token using Supabase
  async function verifyToken(token: string): Promise<any> {
    try {
      const { data, error } = await supabase.auth.getUser(token);

      if (error) {
        throw error;
      }

      return data.user;
    } catch (error) {
      throw new Error('Invalid token');
    }
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

      const user = await verifyToken(token);

      // Attach user to request object
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

  // Optional authentication (for public endpoints that can work with or without auth)
  fastify.decorate('authenticateOptional', async (request: any, reply: any) => {
    try {
      const token = extractToken(request.headers.authorization);

      if (token) {
        const user = await verifyToken(token);
        request.user = {
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata,
        };
      }
      // If no token, user remains undefined - this is fine for optional auth
    } catch (error: any) {
      // For optional auth, we don't fail - just log and continue
      fastify.log.warn('Optional auth failed:', error);
      // user remains undefined, which is fine
    }
  });

  // Pre-handler hook to automatically authenticate all routes starting with /api/
  fastify.addHook('preHandler', async (request: any, reply: any) => {
    // Skip authentication for non-API routes and root endpoints
    if (
      !request.url.startsWith('/api/') ||
      request.url === '/api/health' ||
      request.url === '/'
    ) {
      return;
    }

    // Skip authentication for specific public endpoints if needed
    // Add any public API endpoints here
    const publicEndpoints: string[] = [
      // Example: '/api/public/stats'
    ];

    const isPublicEndpoint = publicEndpoints.some((endpoint) =>
      request.url.startsWith(endpoint)
    );

    if (!isPublicEndpoint) {
      await (fastify as any).authenticate(request, reply);
    }
  });
});
