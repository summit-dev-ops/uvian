import fp from 'fastify-plugin';
import Redis from 'ioredis';

export default fp(async (fastify) => {
  const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  };

  const subscriber = new Redis(redisConfig);

  // Use psubscribe to listen for all conversation updates
  subscriber.psubscribe('conversation:*:messages', (err, count) => {
    if (err) {
      fastify.log.error(`Failed to psubscribe: ${err.message}`);
      return;
    }
    fastify.log.info(`Psubscribed to ${count} channels.`);
  });

  subscriber.on('pmessage', (pattern, channel, message) => {
    fastify.log.info(`Received message on channel ${channel}: ${message}`);

    // Channel format: conversation:123:messages
    const conversationId = channel.split(':')[1];

    try {
      const payload = JSON.parse(message);

      // If the payload already follows the new_message structure, use it directly
      if (payload.message) {
        fastify.io.to(conversationId).emit('new_message', {
          ...payload,
          conversationId,
        });
      } else {
        // Fallback for legacy messages or other formats (if any)
        fastify.io.to(conversationId).emit('new_message', {
          conversationId,
          message: payload,
        });
      }
    } catch (error: any) {
      fastify.log.error(`Failed to parse Redis message: ${error.message}`);
    }
  });

  fastify.addHook('onClose', async () => {
    await subscriber.quit();
  });
});
