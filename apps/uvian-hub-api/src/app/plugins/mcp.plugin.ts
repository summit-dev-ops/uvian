import { FastifyPluginAsync } from 'fastify';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createUserClient, adminSupabase } from '../clients/supabase.client';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { Services } from './services';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

declare module 'fastify' {
  interface FastifyInstance {
    mcpServer: McpServer;
    services: Services;
  }
}

type ToolResult = {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
};

const jwtCache = new Map<string, { jwt: string; expiresAt: number }>();
const JWT_TTL_MS = 50 * 60 * 1000;

async function authenticateWithApiKey(
  apiKey: string
): Promise<{ userId: string; jwt: string } | null> {
  if (!apiKey.startsWith('sk_agent_')) {
    return null;
  }

  const apiKeyPrefix = apiKey.substring(0, 16);

  const cached = jwtCache.get(apiKeyPrefix);
  if (cached && cached.expiresAt > Date.now()) {
    return {
      userId: cached.jwt ? extractUserIdFromJwt(cached.jwt) : '',
      jwt: cached.jwt,
    };
  }

  const { data: apiKeyRecord, error } = await adminSupabase
    .from('agent_api_keys')
    .select('id, user_id, api_key_hash, is_active, service')
    .eq('api_key_prefix', apiKeyPrefix)
    .eq('is_active', true)
    .eq('service', 'hub-api')
    .single();

  if (error || !apiKeyRecord) {
    return null;
  }

  const isValid = await bcrypt.compare(apiKey, apiKeyRecord.api_key_hash);
  if (!isValid) {
    return null;
  }

  const { data: userData, error: userError } =
    await adminSupabase.auth.admin.getUserById(apiKeyRecord.user_id);
  if (userError || !userData.user) {
    return null;
  }

  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (!jwtSecret) {
    return null;
  }

  const payload = {
    aud: 'authenticated',
    role: 'authenticated',
    sub: userData.user.id,
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
    iss: 'supabase',
  };

  const newJwt = jwt.sign(payload, jwtSecret, { algorithm: 'HS256' });

  jwtCache.set(apiKeyPrefix, {
    jwt: newJwt,
    expiresAt: Date.now() + JWT_TTL_MS,
  });

  return { userId: userData.user.id, jwt: newJwt };
}

function extractUserIdFromJwt(token: string): string {
  try {
    const decoded = jwt.decode(token) as jwt.JwtPayload | null;
    return decoded?.sub ?? '';
  } catch {
    return '';
  }
}

export const mcpPlugin: FastifyPluginAsync = async (fastify) => {
  async function createAuthenticatedServer(
    userId: string,
    userJwt: string
  ): Promise<McpServer> {
    const userClient = createUserClient(userJwt);
    const clients = { adminClient: adminSupabase, userClient };

    const server = new McpServer(
      {
        name: 'uvian-hub',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    server.registerTool(
      'get_note',
      {
        inputSchema: z.object({ noteId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const note = await fastify.services.note
            .scoped(clients)
            .getNote(args.noteId);
          return {
            content: [{ type: 'text', text: JSON.stringify(note) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    // READ TOOLS - Conversations
    server.registerTool(
      'list_conversations',
      {
        inputSchema: z.object({ spaceId: z.string().optional() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const results = await fastify.services.chat
            .scoped(clients)
            .getConversations();
          return {
            content: [{ type: 'text', text: JSON.stringify(results) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'get_conversation',
      {
        inputSchema: z.object({ conversationId: z.string() }),
      },
      async ({ conversationId }): Promise<ToolResult> => {
        console.log({ conversationId });
        try {
          const result = await fastify.services.chat
            .scoped(clients)
            .getConversation(conversationId);
          return {
            content: [{ type: 'text', text: JSON.stringify(result) }],
          };
        } catch (error) {
          console.log({ error });
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'list_messages',
      {
        inputSchema: z.object({
          conversationId: z.string(),
          limit: z.number().optional(),
          cursor: z.string().optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const result = await fastify.services.chat
            .scoped(clients)
            .getMessages(args.conversationId);
          return {
            content: [{ type: 'text', text: JSON.stringify(result) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    // READ TOOLS - Posts
    server.registerTool(
      'list_posts',
      {
        inputSchema: z.object({
          spaceId: z.string(),
          limit: z.number().optional(),
          cursor: z.string().optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const result = await fastify.services.post
            .scoped(clients)
            .getPostsBySpace(args.spaceId, {
              limit: args.limit,
              cursor: args.cursor,
            });
          return {
            content: [{ type: 'text', text: JSON.stringify(result) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'get_post',
      {
        inputSchema: z.object({
          postId: z.string(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const result = await fastify.services.post
            .scoped(clients)
            .getPost(args.postId);
          return {
            content: [{ type: 'text', text: JSON.stringify(result) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    // WRITE TOOLS - Conversations
    server.registerTool(
      'create_conversation',
      {
        inputSchema: z.object({
          title: z.string(),
          spaceId: z.string().optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          // Bypassed getUser() - using injected userId directly
          const result = await fastify.services.chat
            .scoped(clients)
            .createConversation(userId, {
              title: args.title,
              spaceId: args.spaceId,
            });
          return {
            content: [{ type: 'text', text: JSON.stringify(result) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'send_message',
      {
        inputSchema: z.object({
          conversationId: z.string(),
          content: z.string(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          // Bypassed getUser() - using injected userId directly
          const id = randomUUID();
          const result = await fastify.services.chat
            .scoped(clients)
            .createMessage(userId, args.conversationId, {
              id,
              content: args.content,
            });
          return {
            content: [{ type: 'text', text: JSON.stringify(result) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    // WRITE TOOLS - Spaces
    server.registerTool(
      'create_space',
      {
        inputSchema: z.object({
          name: z.string(),
          description: z.string().optional(),
          isPrivate: z.boolean().optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          // Bypassed getUser() - using injected userId directly
          const result = await fastify.services.spaces
            .scoped(clients)
            .createSpace(userId, {
              name: args.name,
              description: args.description,
              isPrivate: args.isPrivate,
            });
          return {
            content: [{ type: 'text', text: JSON.stringify(result) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    // ==========================================
    // SPACES TOOLS
    // ==========================================

    server.registerTool(
      'list_spaces',
      {
        inputSchema: z.object({}),
      },
      async (): Promise<ToolResult> => {
        try {
          const spaces = await fastify.services.spaces
            .scoped(clients)
            .getSpaces();
          return { content: [{ type: 'text', text: JSON.stringify(spaces) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'get_space',
      {
        inputSchema: z.object({ spaceId: z.string() }),
      },
      async ({ spaceId }): Promise<ToolResult> => {
        try {
          const space = await fastify.services.spaces
            .scoped(clients)
            .getSpace(spaceId);
          return { content: [{ type: 'text', text: JSON.stringify(space) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'get_space_stats',
      {
        inputSchema: z.object({}),
      },
      async (): Promise<ToolResult> => {
        try {
          const stats = await fastify.services.spaces
            .scoped(clients)
            .getSpaceStats(userId);
          return { content: [{ type: 'text', text: JSON.stringify(stats) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'update_space',
      {
        inputSchema: z.object({
          spaceId: z.string(),
          name: z.string().optional(),
          description: z.string().optional(),
          avatarUrl: z.string().optional(),
          coverUrl: z.string().optional(),
          settings: z.record(z.string(), z.unknown()).optional(),
          isPrivate: z.boolean().optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const space = await fastify.services.spaces
            .scoped(clients)
            .updateSpace(userId, args.spaceId, {
              name: args.name,
              description: args.description,
              avatarUrl: args.avatarUrl,
              coverUrl: args.coverUrl,
              settings: args.settings,
              isPrivate: args.isPrivate,
            });
          return { content: [{ type: 'text', text: JSON.stringify(space) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'delete_space',
      {
        inputSchema: z.object({ spaceId: z.string() }),
      },
      async ({ spaceId }): Promise<ToolResult> => {
        try {
          const result = await fastify.services.spaces
            .scoped(clients)
            .deleteSpace(userId, spaceId);
          return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    // ==========================================
    // NOTES TOOLS
    // ==========================================

    server.registerTool(
      'list_notes',
      {
        inputSchema: z.object({
          spaceId: z.string(),
          limit: z.number().optional(),
          cursor: z.string().optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const result = await fastify.services.note
            .scoped(clients)
            .getNotesBySpace(args.spaceId, {
              limit: args.limit,
              cursor: args.cursor,
            });
          return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'update_note',
      {
        inputSchema: z.object({
          noteId: z.string(),
          title: z.string().optional(),
          body: z.string().optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const note = await fastify.services.note
            .scoped(clients)
            .updateNote(userId, args.noteId, {
              title: args.title,
              body: args.body,
            });
          return { content: [{ type: 'text', text: JSON.stringify(note) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'delete_note',
      {
        inputSchema: z.object({ noteId: z.string() }),
      },
      async ({ noteId }): Promise<ToolResult> => {
        try {
          const result = await fastify.services.note
            .scoped(clients)
            .deleteNote(userId, noteId);
          return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    // ==========================================
    // SPACE MEMBERS TOOLS
    // ==========================================

    server.registerTool(
      'get_space_members',
      {
        inputSchema: z.object({ spaceId: z.string() }),
      },
      async ({ spaceId }): Promise<ToolResult> => {
        try {
          const members = await fastify.services.spaces
            .scoped(clients)
            .getSpaceMembers(spaceId);
          return { content: [{ type: 'text', text: JSON.stringify(members) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'invite_space_member',
      {
        inputSchema: z.object({
          spaceId: z.string(),
          targetUserId: z.string(),
          role: z.string().optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const member = await fastify.services.spaces
            .scoped(clients)
            .inviteMember(userId, args.spaceId, args.targetUserId, {
              name: args.role || 'member',
            });
          return { content: [{ type: 'text', text: JSON.stringify(member) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'remove_space_member',
      {
        inputSchema: z.object({
          spaceId: z.string(),
          targetUserId: z.string(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const result = await fastify.services.spaces
            .scoped(clients)
            .removeMember(userId, args.spaceId, args.targetUserId);
          return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'update_space_member',
      {
        inputSchema: z.object({
          spaceId: z.string(),
          targetUserId: z.string(),
          role: z.string(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const member = await fastify.services.spaces
            .scoped(clients)
            .updateMemberRole(userId, args.spaceId, args.targetUserId, {
              name: args.role,
            });
          return { content: [{ type: 'text', text: JSON.stringify(member) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    // ==========================================
    // CONVERSATION MEMBERS TOOLS
    // ==========================================

    server.registerTool(
      'get_conversation_members',
      {
        inputSchema: z.object({ conversationId: z.string() }),
      },
      async ({ conversationId }): Promise<ToolResult> => {
        try {
          const members = await fastify.services.chat
            .scoped(clients)
            .getConversationMembers(conversationId);
          return { content: [{ type: 'text', text: JSON.stringify(members) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'invite_conversation_member',
      {
        inputSchema: z.object({
          conversationId: z.string(),
          targetUserId: z.string(),
          role: z.string().optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const member = await fastify.services.chat
            .scoped(clients)
            .inviteMember(userId, args.conversationId, args.targetUserId, {
              name: args.role || 'member',
            });
          return { content: [{ type: 'text', text: JSON.stringify(member) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'remove_conversation_member',
      {
        inputSchema: z.object({
          conversationId: z.string(),
          targetUserId: z.string(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const result = await fastify.services.chat
            .scoped(clients)
            .removeMember(userId, args.conversationId, args.targetUserId);
          return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'update_conversation_member',
      {
        inputSchema: z.object({
          conversationId: z.string(),
          targetUserId: z.string(),
          role: z.string(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const member = await fastify.services.chat
            .scoped(clients)
            .updateMemberRole(userId, args.conversationId, args.targetUserId, {
              name: args.role,
            });
          return { content: [{ type: 'text', text: JSON.stringify(member) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    // ==========================================
    // CHAT EXPANSION TOOLS
    // ==========================================

    server.registerTool(
      'search_messages',
      {
        inputSchema: z.object({
          conversationId: z.string(),
          q: z.string().optional(),
          senderId: z.string().optional(),
          from: z.string().optional(),
          to: z.string().optional(),
          limit: z.number().optional(),
          offset: z.number().optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const messages = await fastify.services.chat
            .scoped(clients)
            .searchMessages(args.conversationId, {
              q: args.q,
              senderId: args.senderId,
              from: args.from,
              to: args.to,
              limit: args.limit,
              offset: args.offset,
            });
          return {
            content: [{ type: 'text', text: JSON.stringify(messages) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'delete_conversation',
      {
        inputSchema: z.object({ conversationId: z.string() }),
      },
      async ({ conversationId }): Promise<ToolResult> => {
        try {
          const result = await fastify.services.chat
            .scoped(clients)
            .deleteConversation(userId, conversationId);
          return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'delete_message',
      {
        inputSchema: z.object({
          conversationId: z.string(),
          messageId: z.string(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const result = await fastify.services.chat
            .scoped(clients)
            .deleteMessage(userId, args.conversationId, args.messageId);
          return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'update_message',
      {
        inputSchema: z.object({
          conversationId: z.string(),
          messageId: z.string(),
          content: z.string(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const message = await fastify.services.chat
            .scoped(clients)
            .updateMessage(
              userId,
              args.conversationId,
              args.messageId,
              args.content
            );
          return { content: [{ type: 'text', text: JSON.stringify(message) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    // ==========================================
    // PROFILE TOOLS
    // ==========================================

    server.registerTool(
      'get_profile',
      {
        inputSchema: z.object({ profileId: z.string() }),
      },
      async ({ profileId }): Promise<ToolResult> => {
        try {
          const profile = await fastify.services.profile
            .scoped(clients)
            .getProfile(profileId);
          return { content: [{ type: 'text', text: JSON.stringify(profile) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'get_my_profile',
      {
        inputSchema: z.object({}),
      },
      async (): Promise<ToolResult> => {
        try {
          const profile = await fastify.services.profile
            .scoped(clients)
            .getProfileByUserId(userId);
          return { content: [{ type: 'text', text: JSON.stringify(profile) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'update_profile',
      {
        inputSchema: z.object({
          profileId: z.string(),
          displayName: z.string().optional(),
          avatarUrl: z.string().optional(),
          bio: z.string().optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const profile = await fastify.services.profile
            .scoped(clients)
            .updateProfile(userId, args.profileId, {
              displayName: args.displayName,
              avatarUrl: args.avatarUrl,
              bio: args.bio,
            });
          return { content: [{ type: 'text', text: JSON.stringify(profile) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    // ==========================================
    // ASSET TOOLS
    // ==========================================

    server.registerTool(
      'list_assets',
      {
        inputSchema: z.object({
          page: z.number().optional(),
          limit: z.number().optional(),
          type: z.string().optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const result = await fastify.services.asset
            .scoped(clients)
            .getAssets({
              page: args.page,
              limit: args.limit,
              type: args.type,
            });
          return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'get_asset',
      {
        inputSchema: z.object({ assetId: z.string() }),
      },
      async ({ assetId }): Promise<ToolResult> => {
        try {
          const asset = await fastify.services.asset
            .scoped(clients)
            .getAsset(assetId);
          return { content: [{ type: 'text', text: JSON.stringify(asset) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    // ==========================================
    // POSTS TOOLS
    // ==========================================

    server.registerTool(
      'delete_post',
      {
        inputSchema: z.object({ postId: z.string() }),
      },
      async ({ postId }): Promise<ToolResult> => {
        try {
          const result = await fastify.services.post
            .scoped(clients)
            .deletePost(postId, userId);
          return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    // ==========================================
    // WRITE TOOLS - Posts
    // ==========================================

    server.registerTool(
      'create_post',
      {
        inputSchema: z.object({
          spaceId: z.string(),
          contents: z
            .array(
              z.object({
                type: z.enum(['note', 'asset', 'external']),
                note: z
                  .object({
                    title: z.string(),
                    body: z.string(),
                  })
                  .optional(),
                noteId: z.string().optional(),
                assetId: z.string().optional(),
                url: z.string().optional(),
              })
            )
            .optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          // Bypassed getUser() - using injected userId directly
          const post = await fastify.services.post.scoped(clients).createPost({
            spaceId: args.spaceId,
            userId: userId,
          });

          // Process contents
          const contents = args.contents || [];
          for (let i = 0; i < contents.length; i++) {
            const item = contents[i];
            let noteId = item.noteId;

            if (item.type === 'note' && item.note?.title) {
              const createdNote = await fastify.services.note
                .scoped(clients)
                .createNote(
                  userId, // Injected userId
                  {
                    id: item.noteId, // Optional ID passing
                    spaceId: args.spaceId,
                    title: item.note.title,
                    body: item.note.body,
                  }
                );
              noteId = createdNote.id;
            }

            await adminSupabase
              .schema('core_hub')
              .from('post_contents')
              .insert({
                post_id: post.id,
                content_type: item.type,
                note_id: noteId,
                asset_id: item.assetId,
                url: item.url,
                position: i,
              });
          }

          // Return full post
          const fullPost = await fastify.services.post
            .scoped(clients)
            .getPost(post.id);
          return {
            content: [{ type: 'text', text: JSON.stringify(fullPost) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    console.log('[MCP] Server created with tools');
    return server;
  }

  function extractToken(authHeader: string | undefined): string | null {
    if (!authHeader) return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    return parts[1];
  }

  // ==========================================
  // POST /v1/mcp - Receives JSON-RPC Messages (Stateless)
  // ==========================================
  fastify.post('/v1/mcp', async (request, reply) => {
    console.log('[MCP] ========== POST /v1/mcp START ==========');

    try {
      const authHeader = request.headers.authorization;
      const token = extractToken(authHeader);

      if (!token) {
        console.log('[MCP] No token, returning 401');
        return reply
          .code(401)
          .send({ error: 'Unauthorized', message: 'Missing token' });
      }

      let userId: string;
      let userJwt: string;

      if (token.startsWith('sk_agent_')) {
        console.log('[MCP] Authenticating with raw API key...');
        const result = await authenticateWithApiKey(token);
        if (!result) {
          console.log('[MCP] API key authentication failed');
          return reply
            .code(401)
            .send({ error: 'Unauthorized', message: 'Invalid API key' });
        }
        userId = result.userId;
        userJwt = result.jwt;
        console.log('[MCP] API key auth OK, user:', userId);
      } else {
        console.log('[MCP] Validating pre-issued JWT...');
        const jwtSecret = process.env.SUPABASE_JWT_SECRET;
        if (!jwtSecret) {
          console.log('[MCP] JWT_SECRET not configured');
          return reply.code(500).send({
            error: 'Internal server error',
            message: 'JWT_SECRET not configured',
          });
        }

        let decoded: jwt.JwtPayload;
        try {
          decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
        } catch (err) {
          console.log('[MCP] JWT verification failed:', err);
          return reply
            .code(401)
            .send({ error: 'Unauthorized', message: 'Invalid token' });
        }

        if (!decoded.sub || decoded.role !== 'authenticated') {
          console.log('[MCP] Invalid JWT claims');
          return reply
            .code(401)
            .send({ error: 'Unauthorized', message: 'Invalid token claims' });
        }

        userId = decoded.sub;
        userJwt = token;
        console.log('[MCP] JWT auth OK, user:', userId);
      }

      const server = await createAuthenticatedServer(userId, userJwt);
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // stateless mode
      });

      console.log('[MCP] Connecting server to transport...');
      await server.connect(transport);

      console.log('[MCP] Handling request...');
      await transport.handleRequest(request.raw, reply.raw, request.body);

      console.log(
        '[MCP] handleRequest returned, status:',
        reply.raw.statusCode
      );
      console.log('[MCP] ========== POST /v1/mcp END ==========');
    } catch (error) {
      console.log('[MCP] POST Error:', error);
      fastify.log.error(error, 'MCP POST error');
      try {
        if (!reply.raw.writableEnded) {
          reply.code(500).send({ error: 'MCP POST failed: ' + String(error) });
        }
      } catch {
        // Response already sent
      }
    }
  });

  // GET /v1/mcp - Not supported in stateless mode
  fastify.get('/v1/mcp', async (request, reply) => {
    console.log('[MCP] ========== GET /v1/mcp START ==========');
    console.log('[MCP] GET not supported in stateless mode');
    reply
      .code(405)
      .header('Allow', 'POST')
      .send('Method Not Allowed - Use POST for stateless MCP');
    console.log('[MCP] ========== GET /v1/mcp END ==========');
  });

  fastify.decorate('mcpServer', null);

  fastify.log.info('MCP plugin registered');
};

export default mcpPlugin;
