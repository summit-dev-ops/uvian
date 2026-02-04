import { Server } from 'socket.io';
import { redisConnection } from '../clients/redis';
import { queueService } from '../services/queue.service';
import { userService } from '../services/user.service';
import { supabase } from '../services/supabase.service';

export {};

declare module 'fastify' {
  export interface FastifyInstance {
    io: Server;
    redis: typeof redisConnection;
    queueService: typeof queueService;
    userService: typeof userService;
    supabase: typeof supabase;
    authenticate: (request: any, reply: any) => Promise<void>;
    authenticateOptional: (request: any, reply: any) => Promise<void>;
  }
}
