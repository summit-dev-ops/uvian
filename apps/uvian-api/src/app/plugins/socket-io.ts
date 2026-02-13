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
    profile: {
      id: string;
      type: string; // e.g., 'personal' | 'business'
      displayName: string;
    };
  }
}

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
        }
      }
    );
  };

  // 2. Helper: Check access using the SCOPED client (RLS enforced)
  async function checkConversationAccess(
    client: SupabaseClient,
    profileId: string,
    conversationId: string
  ): Promise<boolean> {
    try {
      // We don't need complex validation logic anymore.
      // If RLS says we can see the member record, we have access.
      const { data, error } = await client
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

    // --- MIDDLEWARE ---
    fastify.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token;
        const profileId = socket.handshake.auth?.profileId;

        if (!token) return next(new Error('Authentication error: No token'));
        if (!profileId) return next(new Error('Authentication error: No profileId'));

        // A. Create the Scoped Client
        const scopedClient = createScopedClient(token);

        // B. Verify Token (and get User)
        // We use the scoped client. If token is bad, this fails.
        const { data: { user }, error: authError } = await scopedClient.auth.getUser();

        if (authError || !user) {
          return next(new Error('Authentication error: Invalid token'));
        }

        // C. Verify Profile Ownership via RLS
        // Instead of calling profileService, we just try to fetch the profile.
        // If the RLS policy "Users can only see their own profiles" is active,
        // this query will return null if the user is lying about their profileId.
        const { data: profile, error: profileError } = await scopedClient
          .from('profiles')
          .select('id, type, display_name') // Select fields you need
          .eq('id', profileId)
          .single();

        if (profileError || !profile) {
          return next(new Error('Authentication error: Profile not found or access denied'));
        }

        // D. Attach everything to the socket
        socket.supabase = scopedClient; // <--- The most important line
        socket.user = {
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata,
        };
        socket.profile = {
          id: profile.id,
          type: profile.type,
          displayName: profile.display_name, // Map snake_case to camelCase if needed
        };

        fastify.log.info(
          `Authenticated socket: ${socket.id} (User: ${user.id}, Profile: ${profileId})`
        );
        next();
      } catch (error: any) {
        fastify.log.warn(`Socket auth failed: ${error.message}`);
        next(new Error('Authentication error'));
      }
    });

    // --- CONNECTION ---
    fastify.io.on('connection', (socket) => {
      const { profile, supabase } = socket; // Destructure the scoped client

      fastify.log.info(`Socket connected: ${socket.id}`);

      // Event: Join Conversation
      socket.on('join_conversation', async (payload: { conversationId: string }) => {
        try {
          const { conversationId } = payload;

          // Pass the SCOPED client to the helper
          const hasAccess = await checkConversationAccess(
            supabase, // <--- Using socket.supabase
            profile.id,
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
      });

      // Event: Send Message
      socket.on('send_message', async (payload: { conversationId: string; text: string }) => {
        try {
          const { conversationId, text } = payload;

          // 1. Verify Access (RLS)
          const hasAccess = await checkConversationAccess(
            supabase, // <--- Using socket.supabase
            profile.id,
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
              id: profile.id,
              displayName: profile.displayName,
              type: profile.type,
            },
            timestamp: new Date().toISOString(),
          };

          fastify.io.to(conversationId).emit('new_message', messagePayload);
        } catch (error) {
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      socket.on('disconnect', () => {
        // No cleanup needed for supabase client
      });
    });
  });
});