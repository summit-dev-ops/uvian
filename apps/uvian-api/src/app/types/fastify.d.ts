import { Server } from 'socket.io';
import { redisConnection } from '../clients/redis';
import { queueService } from '../services/queue.service';

export {};

declare module 'fastify' {
  export interface FastifyInstance {
    io: Server;
    redis: typeof redisConnection;
    queueService: typeof queueService;
  }
}
