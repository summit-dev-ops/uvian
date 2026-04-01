import fp from 'fastify-plugin';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  Client,
  Channel,
  Guild,
  GuildMember,
  Message,
  ThreadChannel,
} from 'discord.js';
import type { CacheService } from './cache.js';
import { adminSupabase } from '../clients/supabase.client.js';

type ToolResult = {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
};

interface DiscordMessage {
  id: string;
  channel_id: string;
  author: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    bot: boolean;
  };
  content: string;
  timestamp: string;
  edited_timestamp: string | null;
  attachments: Array<{ id: string; filename: string; url: string }>;
  embeds: Array<unknown>;
  message_reference: { message_id: string } | null;
}

interface DiscordChannel {
  id: string;
  type: number;
  name: string;
  topic: string | null;
  parent_id: string | null;
}

interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  member_count: number;
  description: string | null;
}

interface DiscordMember {
  user_id: string;
  nickname: string | null;
  roles: string[];
  joined_at: string;
  premium_since: string | null;
}

interface DiscordThreadInfo {
  id: string;
  name: string;
  member_count: number;
  message_count: number;
  archived: boolean;
}

function formatMessage(message: Message): DiscordMessage {
  return {
    id: message.id,
    channel_id: message.channelId,
    author: {
      id: message.author.id,
      username: message.author.username,
      discriminator: message.author.discriminator,
      avatar: message.author.displayAvatarURL(),
      bot: message.author.bot,
    },
    content: message.content,
    timestamp: message.createdAt.toISOString(),
    edited_timestamp: message.editedAt?.toISOString() ?? null,
    attachments: message.attachments.map((a) => ({
      id: a.id,
      filename: a.name,
      url: a.url,
    })),
    embeds: message.embeds.map((e) => e.toJSON()),
    message_reference: message.reference?.messageId
      ? { message_id: message.reference.messageId }
      : null,
  };
}

function formatChannel(channel: Channel): DiscordChannel | null {
  if (!channel) return null;
  return {
    id: channel.id,
    type: channel.type,
    name: 'name' in channel ? (channel as any).name : 'Unknown',
    topic: 'topic' in channel ? (channel as any).topic : null,
    parent_id: 'parentId' in channel ? (channel as any).parentId : null,
  };
}

function formatGuild(guild: Guild | null): DiscordGuild | null {
  if (!guild) return null;
  return {
    id: guild.id,
    name: guild.name,
    icon: guild.iconURL(),
    member_count: guild.memberCount,
    description: guild.description,
  };
}

function formatMember(member: GuildMember): DiscordMember {
  return {
    user_id: member.user?.id ?? '',
    nickname: member.nickname,
    roles: member.roles.cache.map((r) => r.id),
    joined_at: member.joinedAt?.toISOString() ?? '',
    premium_since: member.premiumSince?.toISOString() ?? null,
  };
}

function formatThreadInfo(channel: ThreadChannel): DiscordThreadInfo {
  return {
    id: channel.id,
    name: channel.name,
    member_count: channel.memberCount ?? 0,
    message_count: channel.messageCount ?? 0,
    archived: channel.archived ?? false,
  };
}

declare module 'fastify' {
  interface FastifyInstance {
    mcpServer: McpServer;
  }
}

const RATE_LIMIT_KEY = 'discord:ratelimit:';
const RATE_LIMIT_WINDOW = 10;
const RATE_LIMIT_REQUESTS = 10;

async function authenticateWithApiKey(apiKey: string): Promise<string | null> {
  if (!apiKey.startsWith('sk_agent_')) return null;

  const apiKeyPrefix = apiKey.substring(0, 16);

  const { data: apiKeyRecord } = await adminSupabase
    .from('agent_api_keys')
    .select('user_id, api_key_hash, is_active, service')
    .eq('api_key_prefix', apiKeyPrefix)
    .eq('is_active', true)
    .eq('service', 'discord')
    .single();

  if (!apiKeyRecord) return null;

  const isValid = await bcrypt.compare(apiKey, apiKeyRecord.api_key_hash);
  if (!isValid) return null;

  return apiKeyRecord.user_id;
}

export default fp(async (fastify) => {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const applicationId = process.env.DISCORD_APPLICATION_ID;

  if (!botToken || !applicationId) {
    fastify.log.warn('Discord env vars not set - MCP server will not start');
    return;
  }

  const cache: CacheService = (fastify as any).cache;
  const discordClient = new Client({ intents: [] });
  await discordClient.login(botToken);

  const server = new McpServer({
    name: 'uvian-discord-connector',
    version: '1.0.0',
  });

  async function checkRateLimit(): Promise<boolean> {
    if (!cache) return true;
    return await cache.getRateLimit(
      RATE_LIMIT_KEY,
      RATE_LIMIT_REQUESTS,
      RATE_LIMIT_WINDOW
    );
  }

  server.registerTool(
    'discord_send_dm',
    {
      inputSchema: z.object({
        user_id: z.string().describe('The Discord user ID to send DM to'),
        content: z.string().describe('The message content to send'),
      }),
    },
    async (args): Promise<ToolResult> => {
      try {
        if (!(await checkRateLimit())) {
          return {
            content: [
              { type: 'text', text: 'Rate limited. Please try again later.' },
            ],
            isError: true,
          };
        }
        const user = await discordClient.users.fetch(args.user_id);
        if (!user) {
          return {
            content: [{ type: 'text', text: 'User not found' }],
            isError: true,
          };
        }
        const dmChannel = await user.createDM();
        await dmChannel.send(args.content);
        return {
          content: [{ type: 'text', text: 'Message sent successfully' }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${
                error instanceof Error ? error.message : 'Unknown'
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    'discord_send_channel',
    {
      inputSchema: z.object({
        channel_id: z
          .string()
          .describe('The Discord channel ID to send message to'),
        content: z.string().describe('The message content to send'),
      }),
    },
    async (args): Promise<ToolResult> => {
      try {
        if (!(await checkRateLimit())) {
          return {
            content: [
              { type: 'text', text: 'Rate limited. Please try again later.' },
            ],
            isError: true,
          };
        }
        const channel = await discordClient.channels.fetch(args.channel_id);
        if (!channel || !channel.isTextBased()) {
          return {
            content: [
              { type: 'text', text: 'Channel not found or not text-based' },
            ],
            isError: true,
          };
        }
        await (channel as any).send(args.content);
        return {
          content: [{ type: 'text', text: 'Message sent successfully' }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${
                error instanceof Error ? error.message : 'Unknown'
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    'discord_get_user',
    {
      inputSchema: z.object({
        user_id: z.string().describe('The Discord user ID to fetch'),
      }),
    },
    async (args): Promise<ToolResult> => {
      try {
        if (!(await checkRateLimit())) {
          return {
            content: [
              { type: 'text', text: 'Rate limited. Please try again later.' },
            ],
            isError: true,
          };
        }
        const user = await discordClient.users.fetch(args.user_id);
        if (!user) {
          return {
            content: [{ type: 'text', text: 'User not found' }],
            isError: true,
          };
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                id: user.id,
                username: user.username,
                discriminator: user.discriminator,
                avatar: user.displayAvatarURL(),
                bot: user.bot,
              }),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${
                error instanceof Error ? error.message : 'Unknown'
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    'discord_get_recent_messages',
    {
      inputSchema: z.object({
        channel_id: z.string().describe('The Discord channel ID'),
        limit: z
          .number()
          .min(1)
          .max(100)
          .default(10)
          .describe('Number of messages to fetch (default 10)'),
      }),
    },
    async (args): Promise<ToolResult> => {
      try {
        if (!(await checkRateLimit())) {
          return {
            content: [
              { type: 'text', text: 'Rate limited. Please try again later.' },
            ],
            isError: true,
          };
        }
        const channel = await discordClient.channels.fetch(args.channel_id);
        if (!channel || !channel.isTextBased()) {
          return {
            content: [
              { type: 'text', text: 'Channel not found or not text-based' },
            ],
            isError: true,
          };
        }
        const messages = await channel.messages.fetch({ limit: args.limit });
        const formatted = Array.from(messages.values())
          .reverse()
          .map(formatMessage);
        return { content: [{ type: 'text', text: JSON.stringify(formatted) }] };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${
                error instanceof Error ? error.message : 'Unknown'
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    'discord_get_messages_before',
    {
      inputSchema: z.object({
        channel_id: z.string().describe('The Discord channel ID'),
        message_id: z.string().describe('Get messages before this message ID'),
        limit: z
          .number()
          .min(1)
          .max(100)
          .default(10)
          .describe('Number of messages to fetch'),
      }),
    },
    async (args): Promise<ToolResult> => {
      try {
        if (!(await checkRateLimit())) {
          return {
            content: [
              { type: 'text', text: 'Rate limited. Please try again later.' },
            ],
            isError: true,
          };
        }
        const channel = await discordClient.channels.fetch(args.channel_id);
        if (!channel || !channel.isTextBased()) {
          return {
            content: [
              { type: 'text', text: 'Channel not found or not text-based' },
            ],
            isError: true,
          };
        }
        const messages = await channel.messages.fetch({
          before: args.message_id,
          limit: args.limit,
        });
        const formatted = Array.from(messages.values())
          .reverse()
          .map(formatMessage);
        return { content: [{ type: 'text', text: JSON.stringify(formatted) }] };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${
                error instanceof Error ? error.message : 'Unknown'
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    'discord_get_messages_after',
    {
      inputSchema: z.object({
        channel_id: z.string().describe('The Discord channel ID'),
        message_id: z.string().describe('Get messages after this message ID'),
        limit: z
          .number()
          .min(1)
          .max(100)
          .default(10)
          .describe('Number of messages to fetch'),
      }),
    },
    async (args): Promise<ToolResult> => {
      try {
        if (!(await checkRateLimit())) {
          return {
            content: [
              { type: 'text', text: 'Rate limited. Please try again later.' },
            ],
            isError: true,
          };
        }
        const channel = await discordClient.channels.fetch(args.channel_id);
        if (!channel || !channel.isTextBased()) {
          return {
            content: [
              { type: 'text', text: 'Channel not found or not text-based' },
            ],
            isError: true,
          };
        }
        const messages = await channel.messages.fetch({
          after: args.message_id,
          limit: args.limit,
        });
        const formatted = Array.from(messages.values())
          .reverse()
          .map(formatMessage);
        return { content: [{ type: 'text', text: JSON.stringify(formatted) }] };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${
                error instanceof Error ? error.message : 'Unknown'
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    'discord_get_message',
    {
      inputSchema: z.object({
        channel_id: z.string().describe('The Discord channel ID'),
        message_id: z.string().describe('The message ID to fetch'),
      }),
    },
    async (args): Promise<ToolResult> => {
      try {
        if (!(await checkRateLimit())) {
          return {
            content: [
              { type: 'text', text: 'Rate limited. Please try again later.' },
            ],
            isError: true,
          };
        }
        const channel = await discordClient.channels.fetch(args.channel_id);
        if (!channel || !channel.isTextBased()) {
          return {
            content: [
              { type: 'text', text: 'Channel not found or not text-based' },
            ],
            isError: true,
          };
        }
        const message = await channel.messages.fetch(args.message_id);
        if (!message) {
          return {
            content: [{ type: 'text', text: 'Message not found' }],
            isError: true,
          };
        }
        return {
          content: [
            { type: 'text', text: JSON.stringify(formatMessage(message)) },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${
                error instanceof Error ? error.message : 'Unknown'
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    'discord_search_channel_messages',
    {
      inputSchema: z.object({
        channel_id: z.string().describe('The Discord channel ID to search'),
        query: z.string().describe('Text to search for in messages'),
        limit: z
          .number()
          .min(1)
          .max(100)
          .default(10)
          .describe('Maximum messages to return'),
      }),
    },
    async (args): Promise<ToolResult> => {
      try {
        if (!(await checkRateLimit())) {
          return {
            content: [
              { type: 'text', text: 'Rate limited. Please try again later.' },
            ],
            isError: true,
          };
        }
        const channel = await discordClient.channels.fetch(args.channel_id);
        if (!channel || !channel.isTextBased()) {
          return {
            content: [
              { type: 'text', text: 'Channel not found or not text-based' },
            ],
            isError: true,
          };
        }
        const messages = await channel.messages.fetch({ limit: 100 });
        const matching = Array.from(messages.values())
          .filter((m) =>
            m.content.toLowerCase().includes(args.query.toLowerCase())
          )
          .slice(0, args.limit)
          .map(formatMessage);
        return { content: [{ type: 'text', text: JSON.stringify(matching) }] };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${
                error instanceof Error ? error.message : 'Unknown'
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    'discord_get_thread_messages',
    {
      inputSchema: z.object({
        channel_id: z.string().describe('The Discord thread channel ID'),
        limit: z
          .number()
          .min(1)
          .max(100)
          .default(10)
          .describe('Number of messages to fetch'),
      }),
    },
    async (args): Promise<ToolResult> => {
      try {
        if (!(await checkRateLimit())) {
          return {
            content: [
              { type: 'text', text: 'Rate limited. Please try again later.' },
            ],
            isError: true,
          };
        }
        const channel = await discordClient.channels.fetch(args.channel_id);
        if (!channel || !channel.isThread()) {
          return {
            content: [
              { type: 'text', text: 'Channel not found or not a thread' },
            ],
            isError: true,
          };
        }
        const messages = await channel.messages.fetch({ limit: args.limit });
        const formatted = Array.from(messages.values())
          .reverse()
          .map(formatMessage);
        return { content: [{ type: 'text', text: JSON.stringify(formatted) }] };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${
                error instanceof Error ? error.message : 'Unknown'
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    'discord_get_thread_info',
    {
      inputSchema: z.object({
        channel_id: z.string().describe('The Discord thread channel ID'),
      }),
    },
    async (args): Promise<ToolResult> => {
      try {
        if (!(await checkRateLimit())) {
          return {
            content: [
              { type: 'text', text: 'Rate limited. Please try again later.' },
            ],
            isError: true,
          };
        }
        const channel = await discordClient.channels.fetch(args.channel_id);
        if (!channel || !channel.isThread()) {
          return {
            content: [
              { type: 'text', text: 'Channel not found or not a thread' },
            ],
            isError: true,
          };
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(formatThreadInfo(channel as ThreadChannel)),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${
                error instanceof Error ? error.message : 'Unknown'
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    'discord_get_guild_info',
    {
      inputSchema: z.object({
        guild_id: z.string().describe('The Discord guild/server ID'),
      }),
    },
    async (args): Promise<ToolResult> => {
      try {
        if (!(await checkRateLimit())) {
          return {
            content: [
              { type: 'text', text: 'Rate limited. Please try again later.' },
            ],
            isError: true,
          };
        }
        const guild = await discordClient.guilds.fetch(args.guild_id);
        if (!guild) {
          return {
            content: [{ type: 'text', text: 'Guild not found' }],
            isError: true,
          };
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(formatGuild(guild)) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${
                error instanceof Error ? error.message : 'Unknown'
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    'discord_get_guild_channels',
    {
      inputSchema: z.object({
        guild_id: z.string().describe('The Discord guild/server ID'),
      }),
    },
    async (args): Promise<ToolResult> => {
      try {
        if (!(await checkRateLimit())) {
          return {
            content: [
              { type: 'text', text: 'Rate limited. Please try again later.' },
            ],
            isError: true,
          };
        }
        const guild = await discordClient.guilds.fetch(args.guild_id);
        if (!guild) {
          return {
            content: [{ type: 'text', text: 'Guild not found' }],
            isError: true,
          };
        }
        const channels = await guild.channels.fetch();
        const formatted = Array.from(channels.values())
          .filter((c): c is NonNullable<typeof c> => c !== null)
          .map((c) => formatChannel(c as any))
          .filter((c): c is DiscordChannel => c !== null);
        return { content: [{ type: 'text', text: JSON.stringify(formatted) }] };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${
                error instanceof Error ? error.message : 'Unknown'
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    'discord_get_member',
    {
      inputSchema: z.object({
        guild_id: z.string().describe('The Discord guild/server ID'),
        user_id: z.string().describe('The Discord user ID'),
      }),
    },
    async (args): Promise<ToolResult> => {
      try {
        if (!(await checkRateLimit())) {
          return {
            content: [
              { type: 'text', text: 'Rate limited. Please try again later.' },
            ],
            isError: true,
          };
        }
        const guild = await discordClient.guilds.fetch(args.guild_id);
        if (!guild) {
          return {
            content: [{ type: 'text', text: 'Guild not found' }],
            isError: true,
          };
        }
        const member = await guild.members.fetch(args.user_id);
        if (!member) {
          return {
            content: [{ type: 'text', text: 'Member not found' }],
            isError: true,
          };
        }
        return {
          content: [
            { type: 'text', text: JSON.stringify(formatMember(member)) },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${
                error instanceof Error ? error.message : 'Unknown'
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    'discord_get_channel_info',
    {
      inputSchema: z.object({
        channel_id: z.string().describe('The Discord channel ID'),
      }),
    },
    async (args): Promise<ToolResult> => {
      try {
        if (!(await checkRateLimit())) {
          return {
            content: [
              { type: 'text', text: 'Rate limited. Please try again later.' },
            ],
            isError: true,
          };
        }
        const channel = await discordClient.channels.fetch(args.channel_id);
        if (!channel) {
          return {
            content: [{ type: 'text', text: 'Channel not found' }],
            isError: true,
          };
        }
        return {
          content: [
            { type: 'text', text: JSON.stringify(formatChannel(channel)) },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${
                error instanceof Error ? error.message : 'Unknown'
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    'discord_get_message_reactions',
    {
      inputSchema: z.object({
        channel_id: z.string().describe('The Discord channel ID'),
        message_id: z.string().describe('The message ID'),
      }),
    },
    async (args): Promise<ToolResult> => {
      try {
        if (!(await checkRateLimit())) {
          return {
            content: [
              { type: 'text', text: 'Rate limited. Please try again later.' },
            ],
            isError: true,
          };
        }
        const channel = await discordClient.channels.fetch(args.channel_id);
        if (!channel || !channel.isTextBased()) {
          return {
            content: [
              { type: 'text', text: 'Channel not found or not text-based' },
            ],
            isError: true,
          };
        }
        const message = await channel.messages.fetch(args.message_id);
        if (!message) {
          return {
            content: [{ type: 'text', text: 'Message not found' }],
            isError: true,
          };
        }
        const reactions = message.reactions.cache.map((r) => ({
          emoji: r.emoji.name || r.emoji.id || 'unknown',
          count: r.count,
          me: r.me,
        }));
        return { content: [{ type: 'text', text: JSON.stringify(reactions) }] };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${
                error instanceof Error ? error.message : 'Unknown'
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  fastify.decorate('mcpServer', server);

  fastify.post('/v1/mcp', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      const token = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;

      if (!token) {
        return reply
          .code(401)
          .send({ error: 'Unauthorized', message: 'Missing token' });
      }

      if (token.startsWith('sk_agent_')) {
        const result = await authenticateWithApiKey(token);
        if (!result) {
          return reply
            .code(401)
            .send({ error: 'Unauthorized', message: 'Invalid API key' });
        }
      } else {
        const jwtSecret = process.env.SUPABASE_JWT_SECRET;
        if (!jwtSecret) {
          return reply.code(500).send({ error: 'Internal server error' });
        }
        const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
        if (!decoded.sub || decoded.role !== 'authenticated') {
          return reply
            .code(401)
            .send({ error: 'Unauthorized', message: 'Invalid token' });
        }
      }

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      await server.connect(transport);
      await transport.handleRequest(request.raw, reply.raw, request.body);
    } catch (error) {
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

  fastify.get('/v1/mcp', async (_, reply) => {
    reply
      .code(405)
      .header('Allow', 'POST')
      .send('Method Not Allowed - Use POST for stateless MCP');
  });

  fastify.addHook('onClose', async () => {
    fastify.log.info('Disconnecting Discord client for MCP');
    await discordClient.destroy();
  });
});
