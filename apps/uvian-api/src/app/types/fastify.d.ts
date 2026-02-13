import { Server } from 'socket.io';
import { redisConnection } from '../clients/redis';
import { queueService } from '../services/queue.service';
import { userService } from '../services/user.service';
import { supabase } from '../clients/supabase.client';
import { chatService } from '../services/chat.service';
import { spacesService } from '../services/spaces.service';

export {};

declare module 'fastify' {
  export interface FastifyInstance {
    io: Server;
    redis: typeof redisConnection;
    queueService: typeof queueService;
    userService: typeof userService;
    supabase: typeof supabase;
    chatService: typeof chatService;
    spacesService: typeof spacesService;
    authenticate: (request: any, reply: any) => Promise<void>;
    authenticateOptional: (request: any, reply: any) => Promise<void>;
  }
}
