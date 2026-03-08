import fp from 'fastify-plugin';
import fastifySocketIO from 'fastify-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Extend the Socket interface to include our custom properties
declare module 'socket.io' {
  interface Socket {
    supabase: SupabaseClient;
    user: {
      id: string;
      email?: string;
      user_metadata?: any;
    };
  }
}

export default fp(async (fastify) => {
  const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    username: process.env.REDIS_USERNAME,
    family: Number(process.env.REDIS_FAMILY) || 0,
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

  // 1. Helper: Create a client scoped to the socket's token
  const createScopedClient = (token: string) => {
    return createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
        auth: {
          persistSession: false,
        },
      }
    );
  };

  // 2. Helper: Check access using the SCOPED client (RLS enforced)
  async function checkConversationAccess(
    client: SupabaseClient,
    userId: string,
    conversationId: string
  ): Promise<boolean> {
    try {
      // Check if user is a member of the conversation via their profile
      const { data, error } = await client
        .from('conversation_members')
        .select('profile_id')
        .eq('conversation_id', conversationId)
        .eq('profile_id', userId) // Now using user ID directly (user = profile after simplification)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  }

  fastify.ready((err) => {
    if (err) throw err;

    // --- MIDDLEWARE ---
    fastify.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token;

        if (!token) return next(new Error('Authentication error: No token'));

        // A. Create the Scoped Client
        const scopedClient = createScopedClient(token);

        // B. Verify Token (and get User)
        // We use the scoped client. If token is bad, this fails.
        const {
          data: { user },
          error: authError,
        } = await scopedClient.auth.getUser();

        if (authError || !user) {
          return next(new Error('Authentication error: Invalid token'));
        }

        // C. Attach user to the socket
        socket.supabase = scopedClient; // <--- The most important line
        socket.user = {
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata,
        };

        fastify.log.info(
          `Authenticated socket: ${socket.id} (User: ${user.id})`
        );
        next();
      } catch (error: any) {
        fastify.log.warn(`Socket auth failed: ${error.message}`);
        next(new Error('Authentication error'));
      }
    });

    // --- CONNECTION ---
    fastify.io.on('connection', (socket) => {
      const { user, supabase } = socket; // Destructure the scoped client and user

      fastify.log.info(`Socket connected: ${socket.id}`);

      // Event: Join Conversation
      socket.on(
        'join_conversation',
        async (payload: { conversationId: string }) => {
          try {
            const { conversationId } = payload;

            // Pass the SCOPED client to the helper
            const hasAccess = await checkConversationAccess(
              supabase, // <--- Using socket.supabase
              user.id,
              conversationId
            );

            if (!hasAccess) {
              socket.emit('error', { message: 'Access denied' });
              return;
            }

            await socket.join(conversationId);
            socket.emit('joined_conversation', { conversationId });

            fastify.log.info(`Socket ${socket.id} joined ${conversationId}`);
          } catch (error) {
            socket.emit('error', { message: 'Failed to join' });
          }
        }
      );

      // Event: Send Message
      socket.on(
        'send_message',
        async (payload: { conversationId: string; text: string }) => {
          try {
            const { conversationId, text } = payload;

            // 1. Verify Access (RLS)
            const hasAccess = await checkConversationAccess(
              supabase, // <--- Using socket.supabase
              user.id,
              conversationId
            );

            if (!hasAccess) {
              socket.emit('error', { message: 'Access denied' });
              return;
            }

            // 2. Broadcast
            // Note: If you want to persist the message to DB here,
            // ensure you use `socket.supabase` for the INSERT too!
            // await supabase.from('messages').insert({ ... })

            const messagePayload = {
              conversationId,
              text,
              sender: {
                id: user.id,
                displayName: user.email?.split('@')[0] || 'User',
                type: 'personal',
              },
              timestamp: new Date().toISOString(),
            };

            fastify.io.to(conversationId).emit('new_message', messagePayload);
          } catch (error) {
            socket.emit('error', { message: 'Failed to send message' });
          }
        }
      );

      socket.on('disconnect', () => {
        // No cleanup needed for supabase client
      });
    });
  });
});
