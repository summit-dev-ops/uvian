import { FastifyPluginAsync } from 'fastify';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createUserClient, adminSupabase } from '../clients/supabase.client';
import { z } from 'zod';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { scheduleService, subscriptionService } from '../services/factory';
import { ScheduleEvents } from '@org/uvian-events';

declare module 'fastify' {
  interface FastifyInstance {
    mcpServer: McpServer;
  }
}

type ToolResult = {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
};

const jwtCache = new Map<string, { jwt: string; expiresAt: number }>();
const JWT_TTL_MS = 50 * 60 * 1000;

async function authenticateWithApiKey(
  apiKey: string,
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
    .eq('service', 'uvian-scheduler')
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

async function createSubscriptions(
  scheduleId: string,
  subscriberIds: string[],
): Promise<void> {
  const clients = { adminClient: adminSupabase, userClient: adminSupabase };
  const subService = subscriptionService.admin(clients);

  const existingSubs = await subService.getSubscriptionsByResource(
    'uvian.schedule',
    scheduleId,
  );

  const existingUserIds = new Set(existingSubs.map((s) => s.user_id));
  const newSubscriberIds = subscriberIds.filter(
    (uid) => !existingUserIds.has(uid),
  );

  if (newSubscriberIds.length === 0) return;

  const scopedService = subscriptionService.scoped(clients);

  for (const userId of newSubscriberIds) {
    await scopedService.activateSubscription(
      userId,
      'uvian.schedule',
      scheduleId,
    );
  }
}

export const mcpPlugin: FastifyPluginAsync = async (fastify) => {
  async function createAuthenticatedServer(
    userId: string,
    userJwt: string,
  ): Promise<McpServer> {
    createUserClient(userJwt);

    const server = new McpServer(
      {
        name: 'uvian-scheduler',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      },
    );

    const clients = {
      adminClient: adminSupabase,
      userClient: createUserClient(userJwt),
    };
    const svc = scheduleService.scoped(clients);

    server.registerTool(
      'mark_schedule_executed',
      {
        inputSchema: z.object({
          scheduleId: z.string(),
          success: z.boolean().optional().default(true),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          await svc.markExecuted(args.scheduleId, args.success ?? true);
          return {
            content: [
              { type: 'text', text: JSON.stringify({ success: true }) },
            ],
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      'create_schedule',
      {
        inputSchema: z.object({
          type: z.enum(['one_time', 'recurring']).optional(),
          start: z.string().optional(),
          end: z.string().optional(),
          cronExpression: z.string().optional(),
          eventData: z.record(z.string(), z.unknown()).optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const schedule = await svc.createSchedule(userId, {
            type: args.type,
            start: args.start,
            end: args.end,
            cronExpression: args.cronExpression,
            eventData: args.eventData,
            subscriberIds: [userId],
          });

          await createSubscriptions(schedule.id, [userId]);

          fastify.schedulerEmitter.emitEvent(
            ScheduleEvents.SCHEDULE_CREATED,
            `/schedules/${schedule.id}`,
            {
              scheduleId: schedule.id,
              type: schedule.type,
              cronExpression: schedule.cronExpression || undefined,
              subscriberIds: [userId],
              createdBy: userId,
            },
            userId,
          );

          return {
            content: [{ type: 'text', text: JSON.stringify(schedule) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      'list_schedules',
      {
        inputSchema: z.object({
          status: z
            .enum(['active', 'paused', 'completed', 'cancelled'])
            .optional(),
          limit: z.number().optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const result = await svc.listSchedules(userId, {
            status: args.status,
            limit: args.limit,
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
      },
    );

    server.registerTool(
      'get_schedule',
      {
        inputSchema: z.object({
          scheduleId: z.string(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const schedule = await svc.getSchedule(userId, args.scheduleId);

          return {
            content: [{ type: 'text', text: JSON.stringify(schedule) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      'cancel_schedule',
      {
        inputSchema: z.object({
          scheduleId: z.string(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const schedule = await svc.cancelSchedule(userId, args.scheduleId);

          return {
            content: [{ type: 'text', text: JSON.stringify(schedule) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      'pause_schedule',
      {
        inputSchema: z.object({
          scheduleId: z.string(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const schedule = await svc.pauseSchedule(userId, args.scheduleId);

          return {
            content: [{ type: 'text', text: JSON.stringify(schedule) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      'resume_schedule',
      {
        inputSchema: z.object({
          scheduleId: z.string(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const schedule = await svc.resumeSchedule(userId, args.scheduleId);

          return {
            content: [{ type: 'text', text: JSON.stringify(schedule) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      'update_schedule',
      {
        inputSchema: z.object({
          scheduleId: z.string(),
          start: z.string().optional(),
          end: z.string().optional(),
          cronExpression: z.string().optional(),
          eventData: z.record(z.string(), z.unknown()).optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const { scheduleId, ...updateData } = args;
          const schedule = await svc.updateSchedule(
            userId,
            scheduleId,
            updateData,
          );

          return {
            content: [{ type: 'text', text: JSON.stringify(schedule) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
    );

    console.log('[MCP] Scheduler server created with tools');
    return server;
  }

  function extractToken(authHeader: string | undefined): string | null {
    if (!authHeader) return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    return parts[1];
  }

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
        sessionIdGenerator: undefined,
      });

      console.log('[MCP] Connecting server to transport...');
      await server.connect(transport);

      console.log('[MCP] Handling request...');
      await transport.handleRequest(request.raw, reply.raw, request.body);

      console.log(
        '[MCP] handleRequest returned, status:',
        reply.raw.statusCode,
      );
      console.log('[MCP] ========== POST /v1/mcp END ==========');
    } catch (error) {
      console.error('[MCP] POST Error:', error);
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
    console.log('[MCP] ========== GET /v1/mcp START ==========');
    console.log('[MCP] GET not supported in stateless mode');
    reply
      .code(405)
      .header('Allow', 'POST')
      .send('Method Not Allowed - Use POST for stateless MCP');
    console.log('[MCP] ========== GET /v1/mcp END ==========');
  });

  fastify.decorate('mcpServer', null);

  console.log('Scheduler MCP plugin registered');
};

export default mcpPlugin;
