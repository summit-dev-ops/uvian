import { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import supabasePlugin from './plugins/supabase.plugin';
import queuePlugin from './plugins/queue.plugin';
import encryptionPlugin from './plugins/encryption.plugin';
import mcpPlugin from './plugins/mcp.plugin';
import { internalV1Routes } from './routes/internal.v1.routes';
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

  await fastify.register(internalV1Routes, { prefix: '/internal/v1' });
  await fastify.register(publicV1Routes, { prefix: '/public/v1' });

  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });
}
