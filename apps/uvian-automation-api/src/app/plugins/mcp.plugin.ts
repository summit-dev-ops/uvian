import { randomUUID } from 'crypto';

import { FastifyPluginAsync } from 'fastify';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { adminSupabase } from '../clients/supabase.client';
import {
  secretsService,
  llmService,
  mcpService,
  skillService,
  agentConfigService,
  ticketService,
} from '../services';
import {
  createLlm,
  createMcp,
  createSkill,
  updateSkill,
  deleteSkill,
  createAgent,
  updateAgent,
  linkLlm,
  unlinkLlm,
  linkMcp,
  unlinkMcp,
  linkSkill,
  unlinkSkill,
  createSecret,
  deleteSecret,
  createTicket,
  updateTicket,
  resolveTicket,
  assignTicket,
  deleteTicket,
} from '../commands';
import { generateRSAKeyPair, decryptRSA } from '@org/utils-encryption';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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
    _userJwt: string,
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
      },
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

          const clients = {
            adminClient: adminSupabase,
            userClient: adminSupabase,
          };
          const { secret } = await createSecret(
            clients,
            {
              accountId,
              name: `${args.name}_private_key`,
              valueType: 'text',
              value: keyPair.privateKey,
              metadata: {
                ...args.metadata,
                keyType: 'rsa_private_key',
                createdBy: 'mcp-secrets-plugin',
              },
            },
            { eventEmitter: fastify.eventEmitter },
          );

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
      },
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
          const secret = await secretsService
            .admin({ adminClient: adminSupabase, userClient: adminSupabase })
            .getByIdWithDecryptedValue(args.secretId);
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
      },
    );

    server.registerTool(
      'list_secrets',
      {
        inputSchema: z.object({}),
      },
      async (): Promise<ToolResult> => {
        try {
          const secrets = await secretsService
            .scoped({ adminClient: adminSupabase, userClient: adminSupabase })
            .list(accountId);
          return {
            content: [{ type: 'text', text: JSON.stringify(secrets) }],
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
      'delete_secret',
      {
        inputSchema: z.object({
          secretId: z.string(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          await deleteSecret(
            { adminClient: adminSupabase, userClient: adminSupabase },
            { accountId, secretId: args.secretId },
            { eventEmitter: fastify.eventEmitter },
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
      },
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
          const secret = await secretsService
            .admin({ adminClient: adminSupabase, userClient: adminSupabase })
            .getByIdWithDecryptedValue(args.secretId);
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
      },
    );

    server.registerTool(
      'create_agent_config',
      {
        inputSchema: z.object({
          userId: z.string(),
          accountId: z.string(),
          systemPrompt: z.string().optional(),
          maxConversationHistory: z.number().optional(),
          config: z.record(z.string(), z.unknown()).optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const { agent } = await createAgent(
            { adminClient: adminSupabase, userClient: adminSupabase },
            {
              userId: args.userId,
              accountId: args.accountId,
              systemPrompt: args.systemPrompt,
              maxConversationHistory: args.maxConversationHistory,
              config: args.config,
            },
            { eventEmitter: fastify.eventEmitter },
          );
          return { content: [{ type: 'text', text: JSON.stringify(agent) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      'get_agent_config',
      {
        inputSchema: z.object({ agentId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const agent = await agentConfigService
            .scoped({ adminClient: adminSupabase, userClient: adminSupabase })
            .getById(args.agentId);
          return { content: [{ type: 'text', text: JSON.stringify(agent) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      'update_agent_config',
      {
        inputSchema: z.object({
          agentId: z.string(),
          systemPrompt: z.string().optional(),
          maxConversationHistory: z.number().optional(),
          config: z.record(z.string(), z.unknown()).optional(),
          isActive: z.boolean().optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const { agent } = await updateAgent(
            { adminClient: adminSupabase, userClient: adminSupabase },
            {
              agentId: args.agentId,
              userId: userId,
              systemPrompt: args.systemPrompt,
              maxConversationHistory: args.maxConversationHistory,
              config: args.config,
              isActive: args.isActive,
            },
            { eventEmitter: fastify.eventEmitter },
          );
          return { content: [{ type: 'text', text: JSON.stringify(agent) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      'list_llms',
      {
        inputSchema: z.object({ accountId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const llms = await llmService
            .scoped({ adminClient: adminSupabase, userClient: adminSupabase })
            .list(args.accountId);
          return { content: [{ type: 'text', text: JSON.stringify(llms) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      'get_llm',
      {
        inputSchema: z.object({ llmId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const llm = await llmService
            .scoped({ adminClient: adminSupabase, userClient: adminSupabase })
            .get(args.llmId);
          return { content: [{ type: 'text', text: JSON.stringify(llm) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
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
          const { llm } = await createLlm(
            { adminClient: adminSupabase, userClient: adminSupabase },
            args,
            { eventEmitter: fastify.eventEmitter },
          );
          return { content: [{ type: 'text', text: JSON.stringify(llm) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      'list_mcps',
      {
        inputSchema: z.object({ accountId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const mcps = await mcpService
            .scoped({ adminClient: adminSupabase, userClient: adminSupabase })
            .list(args.accountId);
          return { content: [{ type: 'text', text: JSON.stringify(mcps) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      'get_mcp',
      {
        inputSchema: z.object({ mcpId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const mcp = await mcpService
            .scoped({ adminClient: adminSupabase, userClient: adminSupabase })
            .get(args.mcpId);
          return { content: [{ type: 'text', text: JSON.stringify(mcp) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
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
          const { mcp } = await createMcp(
            { adminClient: adminSupabase, userClient: adminSupabase },
            args,
          );
          return { content: [{ type: 'text', text: JSON.stringify(mcp) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
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
          const { link } = await linkLlm(
            { adminClient: adminSupabase, userClient: adminSupabase },
            {
              agentId: args.agentId,
              userId: userId,
              llmId: args.llmId,
              secretName: args.secretName,
              secretValue: args.secretValue,
              isDefault: args.isDefault,
            },
          );
          return { content: [{ type: 'text', text: JSON.stringify(link) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
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
          await unlinkLlm(
            { adminClient: adminSupabase, userClient: adminSupabase },
            { agentId: args.agentId, llmId: args.llmId },
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
      },
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
          const { link } = await linkMcp(
            { adminClient: adminSupabase, userClient: adminSupabase },
            {
              agentId: args.agentId,
              mcpId: args.mcpId,
              secretName: args.secretName,
              secretValue: args.secretValue,
            },
          );
          return { content: [{ type: 'text', text: JSON.stringify(link) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
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
          await unlinkMcp(
            { adminClient: adminSupabase, userClient: adminSupabase },
            { agentId: args.agentId, mcpId: args.mcpId },
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
      },
    );

    server.registerTool(
      'get_agent_llms',
      {
        inputSchema: z.object({ agentId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const llms = await agentConfigService
            .scoped({ adminClient: adminSupabase, userClient: adminSupabase })
            .getLlms(args.agentId);
          return { content: [{ type: 'text', text: JSON.stringify(llms) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      'get_agent_mcps',
      {
        inputSchema: z.object({ agentId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const mcps = await agentConfigService
            .scoped({ adminClient: adminSupabase, userClient: adminSupabase })
            .getMcps(args.agentId);
          return { content: [{ type: 'text', text: JSON.stringify(mcps) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      'create_skill',
      {
        inputSchema: z.object({
          accountId: z.string(),
          name: z.string(),
          description: z.string(),
          content: z.record(z.string(), z.unknown()),
          autoLoadEvents: z.array(z.string()).optional(),
          isPrivate: z.boolean().optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const { skill } = await createSkill(
            { adminClient: adminSupabase, userClient: adminSupabase },
            {
              accountId: args.accountId,
              name: args.name,
              description: args.description,
              content: args.content,
              autoLoadEvents: args.autoLoadEvents,
              isPrivate: args.isPrivate,
            },
            { eventEmitter: fastify.eventEmitter },
          );
          return { content: [{ type: 'text', text: JSON.stringify(skill) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      'list_skills',
      {
        inputSchema: z.object({ accountId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const skills = await skillService
            .scoped({ adminClient: adminSupabase, userClient: adminSupabase })
            .list(args.accountId);
          return { content: [{ type: 'text', text: JSON.stringify(skills) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      'get_skill',
      {
        inputSchema: z.object({ skillId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const skill = await skillService
            .scoped({ adminClient: adminSupabase, userClient: adminSupabase })
            .get(args.skillId);
          return { content: [{ type: 'text', text: JSON.stringify(skill) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      'update_skill',
      {
        inputSchema: z.object({
          skillId: z.string(),
          accountId: z.string(),
          name: z.string().optional(),
          description: z.string().optional(),
          content: z.record(z.string(), z.unknown()).optional(),
          autoLoadEvents: z.array(z.string()).optional(),
          isPrivate: z.boolean().optional(),
          isActive: z.boolean().optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const { skillId, accountId, ...updateData } = args;
          const { skill } = await updateSkill(
            { adminClient: adminSupabase, userClient: adminSupabase },
            { skillId, accountId, ...updateData },
            { eventEmitter: fastify.eventEmitter },
          );
          return { content: [{ type: 'text', text: JSON.stringify(skill) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      'delete_skill',
      {
        inputSchema: z.object({ skillId: z.string(), accountId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          await deleteSkill(
            { adminClient: adminSupabase, userClient: adminSupabase },
            { skillId: args.skillId, accountId: args.accountId },
            { eventEmitter: fastify.eventEmitter },
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
      },
    );

    server.registerTool(
      'link_skill',
      {
        inputSchema: z.object({
          agentId: z.string(),
          skillId: z.string(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const { link } = await linkSkill(
            { adminClient: adminSupabase, userClient: adminSupabase },
            { agentId: args.agentId, userId: userId, skillId: args.skillId },
            { eventEmitter: fastify.eventEmitter },
          );
          return { content: [{ type: 'text', text: JSON.stringify(link) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      'unlink_skill',
      {
        inputSchema: z.object({
          agentId: z.string(),
          skillId: z.string(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          await unlinkSkill(
            { adminClient: adminSupabase, userClient: adminSupabase },
            { agentId: args.agentId, userId: userId, skillId: args.skillId },
            { eventEmitter: fastify.eventEmitter },
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
      },
    );

    server.registerTool(
      'get_agent_skills',
      {
        inputSchema: z.object({ agentId: z.string() }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const skills = await agentConfigService
            .scoped({ adminClient: adminSupabase, userClient: adminSupabase })
            .getSkills(args.agentId);
          return { content: [{ type: 'text', text: JSON.stringify(skills) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      'set_agent_memory',
      {
        inputSchema: z.object({
          agentId: z.string(),
          key: z.string(),
          value: z.record(z.string(), z.unknown()),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const { data, error } = await adminSupabase
            .schema('core_automation')
            .from('agent_shared_memory')
            .upsert(
              {
                agent_id: args.agentId,
                key: args.key,
                value: args.value,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'agent_id,key' },
            )
            .select()
            .single();

          if (error) throw new Error(error.message);

          return {
            content: [
              { type: 'text', text: JSON.stringify({ success: true, data }) },
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
      'get_agent_memory',
      {
        inputSchema: z.object({
          agentId: z.string(),
          key: z.string(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const { data, error } = await adminSupabase
            .schema('core_automation')
            .from('agent_shared_memory')
            .select('*')
            .eq('agent_id', args.agentId)
            .eq('key', args.key)
            .single();

          if (error || !data) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ error: 'Key not found' }),
                },
              ],
              isError: true,
            };
          }

          return { content: [{ type: 'text', text: JSON.stringify(data) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      'list_agent_memory_keys',
      {
        inputSchema: z.object({
          agentId: z.string(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const { data, error } = await adminSupabase
            .schema('core_automation')
            .from('agent_shared_memory')
            .select('key, updated_at')
            .eq('agent_id', args.agentId)
            .order('updated_at', { ascending: false });

          if (error) throw new Error(error.message);

          return {
            content: [{ type: 'text', text: JSON.stringify(data || []) }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
    );

    // =========================================================================
    // Ticket Management Tools
    // =========================================================================

    server.registerTool(
      'create_ticket',
      {
        inputSchema: z.object({
          title: z.string(),
          description: z.string().optional(),
          priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
          assignedTo: z.string().optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const clients = {
            adminClient: adminSupabase,
            userClient: adminSupabase,
          };
          const { ticket } = await createTicket(
            clients,
            {
              id: randomUUID(),
              title: args.title,
              description: args.description,
              priority: args.priority,
              assignedTo: args.assignedTo,
              userId,
            },
            { eventEmitter: fastify.eventEmitter },
          );
          return { content: [{ type: 'text', text: JSON.stringify(ticket) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      'list_tickets',
      {
        inputSchema: z.object({
          status: z.string().optional(),
          priority: z.string().optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const result = await ticketService
            .scoped({ adminClient: adminSupabase, userClient: adminSupabase })
            .list({ status: args.status, priority: args.priority });
          return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      'get_ticket',
      {
        inputSchema: z.object({
          ticketId: z.string(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const ticket = await ticketService
            .scoped({ adminClient: adminSupabase, userClient: adminSupabase })
            .get(args.ticketId);
          return { content: [{ type: 'text', text: JSON.stringify(ticket) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      'update_ticket',
      {
        inputSchema: z.object({
          ticketId: z.string(),
          title: z.string().optional(),
          description: z.string().optional(),
          status: z.string().optional(),
          priority: z.string().optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const clients = {
            adminClient: adminSupabase,
            userClient: adminSupabase,
          };
          const { ticketId, ...updates } = args;
          const { ticket } = await updateTicket(
            clients,
            { ticketId, userId, updates },
            { eventEmitter: fastify.eventEmitter },
          );
          return { content: [{ type: 'text', text: JSON.stringify(ticket) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      'resolve_ticket',
      {
        inputSchema: z.object({
          ticketId: z.string(),
          resolutionPayload: z.record(z.string(), z.unknown()).optional(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const clients = {
            adminClient: adminSupabase,
            userClient: adminSupabase,
          };
          const { ticket } = await resolveTicket(
            clients,
            {
              ticketId: args.ticketId,
              userId,
              resolutionPayload: args.resolutionPayload,
            },
            { eventEmitter: fastify.eventEmitter },
          );
          return { content: [{ type: 'text', text: JSON.stringify(ticket) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      'assign_ticket',
      {
        inputSchema: z.object({
          ticketId: z.string(),
          assignedTo: z.string().nullable(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const clients = {
            adminClient: adminSupabase,
            userClient: adminSupabase,
          };
          const { ticket } = await assignTicket(
            clients,
            {
              ticketId: args.ticketId,
              assignedTo: args.assignedTo,
              assignedBy: userId,
            },
            { eventEmitter: fastify.eventEmitter },
          );
          return { content: [{ type: 'text', text: JSON.stringify(ticket) }] };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      'delete_ticket',
      {
        inputSchema: z.object({
          ticketId: z.string(),
        }),
      },
      async (args): Promise<ToolResult> => {
        try {
          const clients = {
            adminClient: adminSupabase,
            userClient: adminSupabase,
          };
          const result = await deleteTicket(
            clients,
            { ticketId: args.ticketId, userId },
            { eventEmitter: fastify.eventEmitter },
          );
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
          const clients = {
            adminClient: adminSupabase,
            userClient: adminSupabase,
          };
          const agentSecrets = await agentConfigService
            .scoped(clients)
            .getAgentSecrets(userId);
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
        userJwt,
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
