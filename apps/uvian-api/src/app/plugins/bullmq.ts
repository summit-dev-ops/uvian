import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { redisConnection } from '../clients/redis';
import { queueService } from '../services/queue.service';

export default fp(async (fastify: FastifyInstance) => {
  fastify.decorate('redis', redisConnection);
  fastify.decorate('queueService', queueService);

  fastify.addHook('onClose', async () => {
    await redisConnection.quit();
  });
});

declare module 'fastify' {
  export interface FastifyInstance {
    redis: typeof redisConnection;
    queueService: typeof queueService;
  }
}
