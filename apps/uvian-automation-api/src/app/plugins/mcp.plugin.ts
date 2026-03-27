import { FastifyPluginAsync } from 'fastify';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { adminSupabase } from '../clients/supabase.client';
import { secretsService } from '../services/secrets.service';
import {
  agentConfigService,
  UpdateAgentConfigPayload,
} from '../services/agent-config.service';
import { llmService } from '../services/llm.service';
import { mcpService } from '../services/mcp.service';
import { generateRSAKeyPair, decryptRSA } from '../services/encryption.service';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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
      userId: extractUserIdFromJwt(cached.jwt),
      jwt: cached.jwt,
    };
  }

  const { data: apiKeyRecord, error } = await adminSupabase
    .from('agent_api_keys')
    .select('id, user_id, api_key_hash, is_active, service')
    .eq('api_key_prefix', apiKeyPrefix)
    .eq('is_active', true)
    .eq('service', 'automation-api')
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

  return {
    userId: userData.user.id,
    jwt: newJwt,
  };
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
    accountId: string,
    _userJwt: string
  ): Promise<McpServer> {
    const server = new McpServer(
      {
        name: 'uvian-automation-secrets',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    server.registerTool(
      'generate_rsa_keypair',
      {
        inputSchema: z.object({
          name: z.string().min(1, 'Name is required'),
          metadata: z.record(z.string(), z.unknown()).optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const keyPair = generateRSAKeyPair();

          const secret = await secretsService.create({} as any, {
            accountId,
            name: `${args.name}_private_key`,
            valueType: 'text',
            value: keyPair.privateKey,
            metadata: {
              ...args.metadata,
              keyType: 'rsa_private_key',
              createdBy: 'mcp-secrets-plugin',
            },
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  secretId: secret.id,
                  publicKey: keyPair.publicKey,
                  privateKeySecretName: `${args.name}_private_key`,
                }),
              },
            ],
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
      'get_secret',
      {
        inputSchema: z.object({
          secretId: z.string(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const secret = await secretsService.getByIdWithDecryptedValue(
            args.secretId
          );
          if (!secret) {
            return {
              content: [{ type: 'text', text: 'Secret not found' }],
              isError: true,
            };
          }
          return {
            content: [{ type: 'text', text: JSON.stringify(secret) }],
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
      'list_secrets',
      {
        inputSchema: z.object({}),
      },
      async (): Promise<ToolResult> => {
        try {
          const secrets = await secretsService.list({} as any, accountId);
          return {
            content: [{ type: 'text', text: JSON.stringify(secrets) }],
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
      'delete_secret',
      {
        inputSchema: z.object({
          secretId: z.string(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          await secretsService.delete({} as any, args.secretId);
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
      }
    );

    server.registerTool(
      'decrypt_data',
      {
        inputSchema: z.object({
          secretId: z.string(),
          ciphertext: z.string(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const secret = await secretsService.getByIdWithDecryptedValue(
            args.secretId
          );
          if (!secret) {
            return {
              content: [{ type: 'text', text: 'Secret not found' }],
              isError: true,
            };
          }

          const privateKey = secret.value;
          const plaintext = decryptRSA(args.ciphertext, privateKey);

          return {
            content: [{ type: 'text', text: JSON.stringify({ plaintext }) }],
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
      'create_agent_config',
      {
        inputSchema: z.object({
          userId: z.string(),
          accountId: z.string(),
          systemPrompt: z.string().optional(),
          maxConversationHistory: z.number().optional(),
          skills: z.array(z.record(z.string(), z.unknown())).optional(),
          config: z.record(z.string(), z.unknown()).optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const agent = await agentConfigService.create({} as any, {
            userId: args.userId,
            accountId: args.accountId,
            systemPrompt: args.systemPrompt,
            maxConversationHistory: args.maxConversationHistory,
            skills: args.skills,
            config: args.config,
          });
          return { content: [{ type: 'text', text: JSON.stringify(agent) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'get_agent_config',
      {
        inputSchema: z.object({ agentId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const agent = await agentConfigService.getById(
            {} as any,
            args.agentId
          );
          return { content: [{ type: 'text', text: JSON.stringify(agent) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'update_agent_config',
      {
        inputSchema: z.object({
          agentId: z.string(),
          systemPrompt: z.string().optional(),
          maxConversationHistory: z.number().optional(),
          skills: z.array(z.record(z.string(), z.unknown())).optional(),
          config: z.record(z.string(), z.unknown()).optional(),
          isActive: z.boolean().optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const payload: UpdateAgentConfigPayload = {
            systemPrompt: args.systemPrompt,
            maxConversationHistory: args.maxConversationHistory,
            skills:
              args.skills as unknown as UpdateAgentConfigPayload['skills'],
            config: args.config,
            isActive: args.isActive,
          };
          const agent = await agentConfigService.update(
            {} as any,
            args.agentId,
            payload
          );
          return { content: [{ type: 'text', text: JSON.stringify(agent) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'list_llms',
      {
        inputSchema: z.object({ accountId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const llms = await llmService.list({} as any, args.accountId);
          return { content: [{ type: 'text', text: JSON.stringify(llms) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'get_llm',
      {
        inputSchema: z.object({ llmId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const llm = await llmService.get({} as any, args.llmId);
          return { content: [{ type: 'text', text: JSON.stringify(llm) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'create_llm',
      {
        inputSchema: z.object({
          accountId: z.string(),
          name: z.string(),
          type: z.string(),
          provider: z.string(),
          modelName: z.string(),
          baseUrl: z.string().optional(),
          temperature: z.number().optional(),
          maxTokens: z.number().optional(),
          config: z.record(z.string(), z.unknown()).optional(),
          isDefault: z.boolean().optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const llm = await llmService.create({} as any, args);
          return { content: [{ type: 'text', text: JSON.stringify(llm) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'list_mcps',
      {
        inputSchema: z.object({ accountId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const mcps = await mcpService.list({} as any, args.accountId);
          return { content: [{ type: 'text', text: JSON.stringify(mcps) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'get_mcp',
      {
        inputSchema: z.object({ mcpId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const mcp = await mcpService.get({} as any, args.mcpId);
          return { content: [{ type: 'text', text: JSON.stringify(mcp) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'create_mcp',
      {
        inputSchema: z.object({
          accountId: z.string(),
          name: z.string(),
          type: z.string(),
          url: z.string().optional(),
          authMethod: z.string(),
          config: z.record(z.string(), z.unknown()).optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const mcp = await mcpService.create({} as any, args);
          return { content: [{ type: 'text', text: JSON.stringify(mcp) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'link_llm',
      {
        inputSchema: z.object({
          agentId: z.string(),
          llmId: z.string(),
          secretName: z.string().optional(),
          secretValue: z.string().optional(),
          isDefault: z.boolean().optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const link = await agentConfigService.linkLlm(
            {} as any,
            args.agentId,
            {
              llmId: args.llmId,
              secretName: args.secretName,
              secretValue: args.secretValue,
              isDefault: args.isDefault,
            }
          );
          return { content: [{ type: 'text', text: JSON.stringify(link) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'unlink_llm',
      {
        inputSchema: z.object({
          agentId: z.string(),
          llmId: z.string(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          await agentConfigService.unlinkLlm(
            {} as any,
            args.agentId,
            args.llmId
          );
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
      }
    );

    server.registerTool(
      'link_mcp',
      {
        inputSchema: z.object({
          agentId: z.string(),
          mcpId: z.string(),
          secretName: z.string().optional(),
          secretValue: z.string().optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const link = await agentConfigService.linkMcp(
            {} as any,
            args.agentId,
            {
              mcpId: args.mcpId,
              secretName: args.secretName,
              secretValue: args.secretValue,
            }
          );
          return { content: [{ type: 'text', text: JSON.stringify(link) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'unlink_mcp',
      {
        inputSchema: z.object({
          agentId: z.string(),
          mcpId: z.string(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          await agentConfigService.unlinkMcp(
            {} as any,
            args.agentId,
            args.mcpId
          );
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
      }
    );

    server.registerTool(
      'get_agent_llms',
      {
        inputSchema: z.object({ agentId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const llms = await agentConfigService.getLlms(
            {} as any,
            args.agentId
          );
          return { content: [{ type: 'text', text: JSON.stringify(llms) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    server.registerTool(
      'get_agent_mcps',
      {
        inputSchema: z.object({ agentId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const mcps = await agentConfigService.getMcps(
            {} as any,
            args.agentId
          );
          return { content: [{ type: 'text', text: JSON.stringify(mcps) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      }
    );

    return server;
  }

  function extractToken(authHeader: string | undefined): string | null {
    if (!authHeader) return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    return parts[1];
  }

  fastify.post('/v1/mcp', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      const token = extractToken(authHeader);

      if (!token) {
        return reply
          .code(401)
          .send({ error: 'Unauthorized', message: 'Missing token' });
      }

      let userId: string;
      let accountId = '';
      let userJwt: string;

      if (token.startsWith('sk_agent_')) {
        const result = await authenticateWithApiKey(token);
        if (!result) {
          return reply
            .code(401)
            .send({ error: 'Unauthorized', message: 'Invalid API key' });
        }
        userId = result.userId;
        userJwt = result.jwt;
      } else {
        const jwtSecret = process.env.SUPABASE_JWT_SECRET;
        if (!jwtSecret) {
          return reply.code(500).send({
            error: 'Internal server error',
            message: 'JWT_SECRET not configured',
          });
        }

        let decoded: jwt.JwtPayload;
        try {
          decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
        } catch {
          return reply
            .code(401)
            .send({ error: 'Unauthorized', message: 'Invalid token' });
        }

        if (!decoded.sub || decoded.role !== 'authenticated') {
          return reply
            .code(401)
            .send({ error: 'Unauthorized', message: 'Invalid token claims' });
        }

        userId = decoded.sub;
        accountId = (decoded as Record<string, unknown>)?.account_id as string;
        userJwt = token;

        if (!accountId) {
          const agentSecrets = await agentConfigService.getAgentSecrets(userId);
          if (!agentSecrets) {
            return reply
              .code(401)
              .send({ error: 'Unauthorized', message: 'Account not found' });
          }
        }
      }

      const server = await createAuthenticatedServer(
        userId,
        accountId,
        userJwt
      );
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

  fastify.log.info('Secrets MCP plugin registered');
};

export default mcpPlugin;
