import { redisConnection } from '../clients/redis';
import { queueService } from '../services';

export {};

declare module 'fastify' {
  export interface FastifyInstance {
    redis: typeof redisConnection;
    queueService: typeof queueService;
    authenticate: (request: any, reply: any) => Promise<void>;
    authenticateOptional: (request: any, reply: any) => Promise<void>;
  }
}
