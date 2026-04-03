import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default async function cronRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/api/cron/sync',
    {
      preHandler: [fastify.authenticateInternal],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const result = await fastify.runCronSync();
        reply.send(result);
      } catch (error: any) {
        console.error('Cron sync error:', error);
        reply.code(500).send({ error: 'Cron sync failed' });
      }
    }
  );
}
