import fp from 'fastify-plugin';
import fastifySocketIO from 'fastify-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

export default fp(async (fastify) => {
  const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  };

  const pubClient = new Redis(redisConfig);
  const subClient = pubClient.duplicate();

  fastify.register(fastifySocketIO, {
    adapter: createAdapter(pubClient, subClient),
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  fastify.ready((err) => {
    if (err) throw err;

    fastify.io.on('connection', (socket) => {
      fastify.log.info(`Socket connected: ${socket.id}`);

      socket.on('join_conversation', (payload: { conversationId: string }) => {
        const { conversationId } = payload;
        fastify.log.info(`Socket ${socket.id} joining room: ${conversationId}`);
        socket.join(conversationId);
      });

      socket.on(
        'send_message',
        (payload: { conversationId: string; text: string; sender: string }) => {
          const { conversationId } = payload;
          fastify.log.info(
            `Message received for room ${conversationId}: ${payload.text}`
          );

          // Broadcast to everyone else in the room
          socket.to(conversationId).emit('new_message', payload);

          // TODO: Persist to database
          // TODO: If this is an AI chat, trigger the job worker
        }
      );

      socket.on('disconnect', () => {
        fastify.log.info(`Socket disconnected: ${socket.id}`);
      });
    });
  });
});
