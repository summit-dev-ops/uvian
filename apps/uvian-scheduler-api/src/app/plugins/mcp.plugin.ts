import { FastifyPluginAsync } from 'fastify';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createUserClient, adminSupabase } from '../clients/supabase.client';
import { z } from 'zod';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';

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

export const mcpPlugin: FastifyPluginAsync = async (fastify) => {
  async function createAuthenticatedServer(
    userId: string,
    userJwt: string
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
      }
    );

    server.registerTool(
      'create_schedule',
      {
        inputSchema: z.object({
          agentId: z.string().uuid(),
          description: z.string(),
          scheduledFor: z.string(),
          scheduleType: z.enum(['one_time', 'recurring']).optional(),
          cronExpression: z.string().optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const scheduleId = crypto.randomUUID();
          const now = new Date().toISOString();

          const { data: schedule, error } = await adminSupabase
            .schema('core_automation')
            .from('scheduled_tasks')
            .insert({
              id: scheduleId,
              user_id: userId,
              agent_id: args.agentId,
              description: args.description,
              schedule_type: args.scheduleType || 'one_time',
              scheduled_for: args.scheduledFor,
              cron_expression: args.cronExpression || null,
              status: 'pending',
              retry_count: 0,
              max_retries: 3,
              created_at: now,
              updated_at: now,
            })
            .select()
            .single();

          if (error || !schedule) {
            throw new Error(error?.message || 'Failed to create schedule');
          }

          return {
            content: [{ type: 'text', text: JSON.stringify(mapRow(schedule)) }],
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
      'list_schedules',
      {
        inputSchema: z.object({
          status: z
            .enum(['pending', 'queued', 'completed', 'cancelled', 'failed'])
            .optional(),
          limit: z.number().optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          let query = adminSupabase
            .schema('core_automation')
            .from('scheduled_tasks')
            .select('*')
            .eq('user_id', userId)
            .order('scheduled_for', { ascending: true });

          if (args.status) {
            query = query.eq('status', args.status);
          }
          if (args.limit) {
            query = query.limit(args.limit);
          }

          const { data, error } = await query;

          if (error) throw new Error(error.message);

          const schedules = (data || []).map((row) => mapRow(row));

          return {
            content: [{ type: 'text', text: JSON.stringify(schedules) }],
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
      'get_schedule',
      {
        inputSchema: z.object({
          scheduleId: z.string(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const { data, error } = await adminSupabase
            .schema('core_automation')
            .from('scheduled_tasks')
            .select('*')
            .eq('id', args.scheduleId)
            .eq('user_id', userId)
            .single();

          if (error || !data) {
            throw new Error('Schedule not found');
          }

          return {
            content: [{ type: 'text', text: JSON.stringify(mapRow(data)) }],
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
      'cancel_schedule',
      {
        inputSchema: z.object({
          scheduleId: z.string(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const { data: existing, error: fetchError } = await adminSupabase
            .schema('core_automation')
            .from('scheduled_tasks')
            .select('*')
            .eq('id', args.scheduleId)
            .eq('user_id', userId)
            .single();

          if (fetchError || !existing) {
            throw new Error('Schedule not found');
          }

          if (existing.status !== 'pending' && existing.status !== 'queued') {
            throw new Error(
              'Cannot cancel schedule that is not pending or queued'
            );
          }

          const { data, error } = await adminSupabase
            .schema('core_automation')
            .from('scheduled_tasks')
            .update({
              status: 'cancelled',
              updated_at: new Date().toISOString(),
            })
            .eq('id', args.scheduleId)
            .eq('user_id', userId)
            .select()
            .single();

          if (error || !data) {
            throw new Error('Failed to cancel schedule');
          }

          return {
            content: [{ type: 'text', text: JSON.stringify(mapRow(data)) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
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
        reply.raw.statusCode
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

function mapRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    userId: row.user_id,
    agentId: row.agent_id,
    description: row.description,
    scheduleType: row.schedule_type,
    scheduledFor: row.scheduled_for,
    cronExpression: row.cron_expression,
    status: row.status,
    retryCount: row.retry_count,
    maxRetries: row.max_retries,
    jobId: row.job_id,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default mcpPlugin;
