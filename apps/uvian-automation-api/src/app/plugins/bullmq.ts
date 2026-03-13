import fp from 'fastify-plugin';
import { redisConnection } from '../clients/redis';
import { queueService } from '../services/queue.service';

export default fp(async (fastify) => {
  fastify.decorate('redis', redisConnection);
  fastify.decorate('queueService', queueService);

  fastify.addHook('onClose', async () => {
    await redisConnection.quit();
  });
});
