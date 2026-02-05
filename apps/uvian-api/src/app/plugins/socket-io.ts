import fp from 'fastify-plugin';
import fastifySocketIO from 'fastify-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { supabase } from '../services/supabase.service';
import { profileService } from '../services/profile.service';

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

  // Helper function to extract JWT token from socket handshake
  function extractToken(token?: string): string | null {
    if (!token) return null;
    return token;
  }

  // Helper function to verify JWT token using Supabase
  async function verifySocketToken(token: string) {
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user) {
        throw new Error('Invalid token');
      }
      return data.user;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Helper function to check conversation membership
  async function checkConversationAccess(
    profileId: string,
    conversationId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('conversation_members')
        .select('profile_id')
        .eq('profile_id', profileId)
        .eq('conversation_id', conversationId)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  }

  fastify.ready((err) => {
    if (err) throw err;

    // Authentication middleware for WebSocket connections
    fastify.io.use(async (socket, next) => {
      try {
        const token = extractToken(socket.handshake.auth?.token);

        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const user = await verifySocketToken(token);

        // Get user's profile
        const profile = await profileService.getProfileByAuthUserId(user.id);
        if (!profile) {
          return next(new Error('Profile not found'));
        }

        // Attach user and profile to socket data
        (socket as any).user = {
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata,
        };
        (socket as any).profile = {
          id: profile.id,
          type: profile.type,
          displayName: profile.displayName,
        };

        fastify.log.info(
          `Authenticated socket connection: ${socket.id} (${profile.displayName})`
        );
        next();
      } catch (error: any) {
        fastify.log.warn(
          `Socket authentication failed for ${socket.id}:`,
          error.message
        );
        next(new Error('Authentication error: Invalid or expired token'));
      }
    });

    fastify.io.on('connection', (socket) => {
      const profile = (socket as any).profile;

      fastify.log.info(
        `Socket connected: ${socket.id} (${profile?.displayName})`
      );

      socket.on(
        'join_conversation',
        async (payload: { conversationId: string }) => {
          try {
            const { conversationId } = payload;

            // Verify user has access to this conversation
            const hasAccess = await checkConversationAccess(
              profile.id,
              conversationId
            );

            if (!hasAccess) {
              socket.emit('error', {
                message: 'Access denied to conversation',
              });
              return;
            }

            socket.join(conversationId);
            fastify.log.info(
              `Socket ${socket.id} joined room: ${conversationId}`
            );

            socket.emit('joined_conversation', { conversationId });
          } catch (error: any) {
            socket.emit('error', { message: 'Failed to join conversation' });
          }
        }
      );

      socket.on(
        'send_message',
        async (payload: { conversationId: string; text: string }) => {
          try {
            const { conversationId, text } = payload;

            // Verify user has access to this conversation
            const hasAccess = await checkConversationAccess(
              profile.id,
              conversationId
            );

            if (!hasAccess) {
              socket.emit('error', {
                message: 'Access denied to conversation',
              });
              return;
            }

            // For now, broadcast the message
            const messagePayload = {
              conversationId,
              text,
              sender: {
                id: profile.id,
                displayName: profile.displayName,
                type: profile.type,
              },
              timestamp: new Date().toISOString(),
            };

            // Broadcast to everyone in the room (including sender)
            fastify.io.to(conversationId).emit('new_message', messagePayload);

            fastify.log.info(
              `Message in ${conversationId} from ${profile.displayName}: ${text}`
            );

            // Messages are persisted via chatService.upsertMessage with sender_id
            // TODO: If this is an AI chat, trigger the job worker
          } catch (error: any) {
            socket.emit('error', { message: 'Failed to send message' });
          }
        }
      );

      socket.on('leave_conversation', (payload: { conversationId: string }) => {
        const { conversationId } = payload;
        socket.leave(conversationId);
        fastify.log.info(`Socket ${socket.id} left room: ${conversationId}`);
      });

      socket.on('disconnect', () => {
        fastify.log.info(
          `Socket disconnected: ${socket.id} (${profile?.displayName})`
        );
      });
    });
  });
});
