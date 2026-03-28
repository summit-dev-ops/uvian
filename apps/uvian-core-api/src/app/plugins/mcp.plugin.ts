import { FastifyPluginAsync } from 'fastify';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { adminSupabase, createUserClient } from '../clients/supabase.client';

import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {
  accountService,
  automationProviderService,
  subscriptionService,
  identityService,
  agentService,
} from '../services/factory';

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
    .eq('service', 'core-api')
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
    _userJwt: string
  ): Promise<McpServer> {
    const server = new McpServer(
      {
        name: 'uvian-core',
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

    const adminClient = adminSupabase;
    const userClient = createUserClient(_userJwt);
    const clients = { adminClient, userClient };

    server.registerTool(
      'get_account',
      {
        inputSchema: z.object({ accountId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const account = await accountService
            .scoped(clients)
            .getAccount(args.accountId, userId);
          return { content: [{ type: 'text', text: JSON.stringify(account) }] };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: error.message || String(error) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'list_account_members',
      {
        inputSchema: z.object({ accountId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const members = await accountService
            .scoped(clients)
            .getAccountMembers(args.accountId, userId);
          return { content: [{ type: 'text', text: JSON.stringify(members) }] };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: error.message || String(error) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'get_account_member',
      {
        inputSchema: z.object({ accountId: z.string(), userId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const member = await accountService
            .scoped(clients)
            .getAccountMember(args.accountId, userId, args.userId);
          return { content: [{ type: 'text', text: JSON.stringify(member) }] };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: error.message || String(error) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'get_accounts_for_user',
      {
        inputSchema: z.object({}),
      },
      async (): Promise<ToolResult> => {
        try {
          const accounts = await accountService
            .scoped(clients)
            .getAccounts(userId);
          return {
            content: [{ type: 'text', text: JSON.stringify(accounts) }],
          };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: error.message || String(error) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'list_providers',
      {
        inputSchema: z.object({ accountId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const providers = await automationProviderService
            .scoped(clients)
            .getProvidersByAccount(args.accountId);
          return {
            content: [{ type: 'text', text: JSON.stringify(providers) }],
          };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: error.message || String(error) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'get_provider',
      {
        inputSchema: z.object({
          providerId: z.string(),
          accountId: z.string(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const provider = await automationProviderService
            .scoped(clients)
            .getProviderById(args.providerId, args.accountId);
          return {
            content: [{ type: 'text', text: JSON.stringify(provider) }],
          };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: error.message || String(error) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'get_internal_provider',
      {
        inputSchema: z.object({ accountId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const provider = await automationProviderService
            .scoped(clients)
            .getInternalProvider(args.accountId);
          return {
            content: [{ type: 'text', text: JSON.stringify(provider) }],
          };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: error.message || String(error) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'create_provider',
      {
        inputSchema: z.object({
          accountId: z.string(),
          name: z.string(),
          type: z.enum(['internal', 'webhook']).optional(),
          url: z.string().optional(),
          auth_method: z.enum(['none', 'bearer', 'api_key']).optional(),
          auth_config: z.record(z.string(), z.unknown()).optional(),
          is_active: z.boolean().optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const provider = await automationProviderService
            .scoped(clients)
            .createProvider(userId, args.accountId, {
              account_id: args.accountId,
              owner_user_id: userId,
              name: args.name,
              type: args.type,
              url: args.url,
              auth_method: args.auth_method,
              auth_config: args.auth_config,
              is_active: args.is_active,
            });
          return {
            content: [{ type: 'text', text: JSON.stringify(provider) }],
          };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: error.message || String(error) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'update_provider',
      {
        inputSchema: z.object({
          providerId: z.string(),
          accountId: z.string(),
          name: z.string().optional(),
          type: z.enum(['internal', 'webhook']).optional(),
          url: z.string().optional(),
          auth_method: z.enum(['none', 'bearer', 'api_key']).optional(),
          auth_config: z.record(z.string(), z.unknown()).optional(),
          is_active: z.boolean().optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const provider = await automationProviderService
            .scoped(clients)
            .updateProvider(userId, args.providerId, args.accountId, {
              name: args.name,
              type: args.type,
              url: args.url,
              auth_method: args.auth_method,
              auth_config: args.auth_config,
              is_active: args.is_active,
            });
          return {
            content: [{ type: 'text', text: JSON.stringify(provider) }],
          };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: error.message || String(error) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'delete_provider',
      {
        inputSchema: z.object({
          providerId: z.string(),
          accountId: z.string(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          await automationProviderService
            .scoped(clients)
            .deleteProvider(userId, args.providerId, args.accountId);
          return {
            content: [
              { type: 'text', text: JSON.stringify({ success: true }) },
            ],
          };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: error.message || String(error) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'list_subscriptions',
      {
        inputSchema: z.object({}),
      },
      async (): Promise<ToolResult> => {
        try {
          const subscriptions = await subscriptionService
            .scoped(clients)
            .getSubscriptionsByUser(userId);
          return {
            content: [{ type: 'text', text: JSON.stringify(subscriptions) }],
          };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: error.message || String(error) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'get_subscription',
      {
        inputSchema: z.object({ subscriptionId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const subscription = await subscriptionService
            .admin(clients)
            .getSubscriptionById(args.subscriptionId);
          return {
            content: [{ type: 'text', text: JSON.stringify(subscription) }],
          };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: error.message || String(error) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'get_subscriptions_by_resource',
      {
        inputSchema: z.object({
          resourceType: z.string(),
          resourceId: z.string(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const subscriptions = await subscriptionService
            .admin(clients)
            .getSubscriptionsByResource(args.resourceType, args.resourceId);
          return {
            content: [{ type: 'text', text: JSON.stringify(subscriptions) }],
          };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: error.message || String(error) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'create_subscription',
      {
        inputSchema: z.object({
          resourceType: z.string(),
          resourceId: z.string(),
          isActive: z.boolean().optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const subscription = await subscriptionService
            .scoped(clients)
            .createSubscription(userId, {
              resource_type: args.resourceType,
              resource_id: args.resourceId,
              is_active: args.isActive,
            });
          return {
            content: [{ type: 'text', text: JSON.stringify(subscription) }],
          };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: error.message || String(error) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'delete_subscription',
      {
        inputSchema: z.object({ subscriptionId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          await subscriptionService
            .scoped(clients)
            .deleteSubscription(userId, args.subscriptionId);
          return {
            content: [
              { type: 'text', text: JSON.stringify({ success: true }) },
            ],
          };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: error.message || String(error) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'list_identities',
      {
        inputSchema: z.object({}),
      },
      async (): Promise<ToolResult> => {
        try {
          const identities = await identityService
            .scoped(clients)
            .getIdentitiesByUser(userId);
          return {
            content: [{ type: 'text', text: JSON.stringify(identities) }],
          };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: error.message || String(error) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'get_identity',
      {
        inputSchema: z.object({ identityId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const identity = await identityService
            .admin(clients)
            .getIdentityById(args.identityId);
          return {
            content: [{ type: 'text', text: JSON.stringify(identity) }],
          };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: error.message || String(error) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'get_identity_by_provider',
      {
        inputSchema: z.object({
          provider: z.string(),
          providerUserId: z.string(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const identity = await identityService
            .admin(clients)
            .getIdentityByProviderUserId(args.provider, args.providerUserId);
          return {
            content: [{ type: 'text', text: JSON.stringify(identity) }],
          };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: error.message || String(error) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'create_identity',
      {
        inputSchema: z.object({
          provider: z.string(),
          providerUserId: z.string(),
          metadata: z.record(z.string(), z.unknown()).optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const identity = await identityService
            .scoped(clients)
            .createIdentity(userId, {
              user_id: userId,
              provider: args.provider,
              provider_user_id: args.providerUserId,
              metadata: args.metadata,
            } as any);
          return {
            content: [{ type: 'text', text: JSON.stringify(identity) }],
          };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: error.message || String(error) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'update_identity',
      {
        inputSchema: z.object({
          identityId: z.string(),
          provider: z.string().optional(),
          providerUserId: z.string().optional(),
          metadata: z.record(z.string(), z.unknown()).optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const identity = await identityService
            .scoped(clients)
            .updateIdentity(userId, args.identityId, {
              provider: args.provider,
              provider_user_id: args.providerUserId,
              metadata: args.metadata,
            });
          return {
            content: [{ type: 'text', text: JSON.stringify(identity) }],
          };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: error.message || String(error) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'delete_identity',
      {
        inputSchema: z.object({ identityId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          await identityService
            .scoped(clients)
            .deleteIdentity(userId, args.identityId);
          return {
            content: [
              { type: 'text', text: JSON.stringify({ success: true }) },
            ],
          };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: error.message || String(error) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'list_agents',
      {
        inputSchema: z.object({ accountId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const agents = await agentService
            .scoped(clients)
            .getAgents(args.accountId);
          return { content: [{ type: 'text', text: JSON.stringify(agents) }] };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: error.message || String(error) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'get_agent',
      {
        inputSchema: z.object({ accountId: z.string(), agentId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const agent = await agentService
            .scoped(clients)
            .getAgent(args.agentId, args.accountId);
          return { content: [{ type: 'text', text: JSON.stringify(agent) }] };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: error.message || String(error) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'create_agent',
      {
        inputSchema: z.object({ accountId: z.string(), name: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const agent = await agentService
            .scoped(clients)
            .createAgent(userId, args.accountId, args.name);
          return { content: [{ type: 'text', text: JSON.stringify(agent) }] };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: error.message || String(error) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'delete_agent',
      {
        inputSchema: z.object({ accountId: z.string(), agentId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          await agentService
            .scoped(clients)
            .deleteAgent(userId, args.agentId, args.accountId);
          return {
            content: [
              { type: 'text', text: JSON.stringify({ success: true }) },
            ],
          };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: error.message || String(error) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'list_user_automation_providers',
      {
        inputSchema: z.object({}),
      },
      async (): Promise<ToolResult> => {
        try {
          const providers = await automationProviderService
            .scoped(clients)
            .getProvidersByUser(userId);
          return {
            content: [{ type: 'text', text: JSON.stringify(providers) }],
          };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: error.message || String(error) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'get_user_automation_provider',
      {
        inputSchema: z.object({ providerId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const provider = await automationProviderService
            .scoped(clients)
            .getUserLinkById(args.providerId);
          return {
            content: [{ type: 'text', text: JSON.stringify(provider) }],
          };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: error.message || String(error) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'link_user_automation_provider',
      {
        inputSchema: z.object({ automationProviderId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const provider = await automationProviderService
            .scoped(clients)
            .linkUserToProvider(userId, args.automationProviderId);
          return {
            content: [{ type: 'text', text: JSON.stringify(provider) }],
          };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: error.message || String(error) }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'unlink_user_automation_provider',
      {
        inputSchema: z.object({ providerLinkId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          await automationProviderService
            .scoped(clients)
            .unlinkUserFromProvider(userId, args.providerLinkId);
          return {
            content: [
              { type: 'text', text: JSON.stringify({ success: true }) },
            ],
          };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: error.message || String(error) }],
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
