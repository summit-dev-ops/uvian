import { FastifyInstance } from 'fastify';

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/api/health', async () => {
    return {
      status: 'ok',
      service: 'uvian-discord-connector',
      timestamp: new Date().toISOString(),
    };
  });
}
