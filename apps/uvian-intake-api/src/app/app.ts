import { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import supabasePlugin from './plugins/supabase.plugin';
import queuePlugin from './plugins/queue.plugin';
import encryptionPlugin from './plugins/encryption.plugin';
import mcpPlugin from './plugins/mcp.plugin';
import authPlugin from './plugins/auth.plugin';
import internalAuthPlugin from './plugins/internal-auth';
import eventEmitterPlugin from './plugins/event-emitter';
import apiKeysRoutes from './routes/api-keys.routes';
import intakesRoutes from './routes/intakes.routes';
import { publicV1Routes } from './routes/public.v1.routes';

export type AppOptions = Record<string, unknown>;

export async function app(fastify: FastifyInstance, _opts: AppOptions) {
  await fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  });

  await fastify.register(supabasePlugin);
  await fastify.register(queuePlugin);
  await fastify.register(encryptionPlugin);
  await fastify.register(mcpPlugin);
  await fastify.register(authPlugin);
  await fastify.register(internalAuthPlugin);
  await fastify.register(eventEmitterPlugin);

  await fastify.register(apiKeysRoutes, { prefix: '/api' });
  await fastify.register(intakesRoutes, { prefix: '/api' });
  await fastify.register(publicV1Routes, { prefix: '/api/public' });

  fastify.get('/api/health', async () => {
    return {
      status: 'ok',
      service: 'uvian-intake-api',
      timestamp: new Date().toISOString(),
    };
  });
}
