import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { adminSupabase, createUserClient } from '../clients/supabase.client';
import { encrypt } from '@org/utils-encryption';
import { configureAgent } from '../services';
import { createAgent } from '../commands/agent';
import { createSecret } from '../commands/secret';
import { createMcp } from '../commands/mcp';
import { linkMcp } from '../commands/agent';

function getClients(request: FastifyRequest) {
  const authHeader = request.headers.authorization as string | undefined;
  const userClient = authHeader
    ? createUserClient(authHeader.replace('Bearer ', ''))
    : adminSupabase;
  return {
    adminClient: adminSupabase,
    userClient,
  };
}

interface SystemConfig {
  name: string;
  url: string;
  service: string;
}

interface InitAgentBody {
  user_id: string;
  account_id: string;
  api_key: string;
  api_key_prefix: string;
  systems?: SystemConfig[];
}

const DEFAULT_SYSTEM_CONFIGS: SystemConfig[] = [
  { name: 'uvian-core', url: '', service: 'core-api' },
  { name: 'uvian-hub', url: '', service: 'hub-api' },
  { name: 'uvian-scheduler', url: '', service: 'uvian-scheduler' },
  { name: 'uvian-automation', url: '', service: 'automation-api' },
  { name: 'uvian-intake', url: '', service: 'intake-api' },
];

function getSystemUrl(systemName: string): string | undefined {
  const envVarMap: Record<string, string | undefined> = {
    'uvian-core': process.env.UVIAN_CORE_API_URL,
    'uvian-hub': process.env.UVIAN_HUB_API_URL,
    'uvian-scheduler': process.env.UVIAN_SCHEDULER_API_URL,
    'uvian-automation': process.env.UVIAN_AUTOMATION_API_URL,
    'uvian-intake': process.env.UVIAN_INTAKE_API_URL,
  };
  return envVarMap[systemName];
}

function getMcpDisplayName(systemName: string): string {
  const nameMap: Record<string, string> = {
    'uvian-core': 'Uvian Core',
    'uvian-hub': 'Uvian Hub',
    'uvian-scheduler': 'Uvian Scheduler',
    'uvian-automation': 'Uvian Automation',
    'uvian-intake': 'Uvian Intake',
  };
  return nameMap[systemName] || systemName;
}

export default async function agentRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: InitAgentBody }>(
    '/api/agents/init',
    {
      preHandler: [fastify.authenticateInternal],
      schema: {
        body: {
          type: 'object',
          required: ['user_id', 'account_id', 'api_key', 'api_key_prefix'],
          properties: {
            user_id: { type: 'string' },
            account_id: { type: 'string' },
            api_key: { type: 'string' },
            api_key_prefix: { type: 'string' },
            systems: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name', 'url', 'service'],
                properties: {
                  name: { type: 'string' },
                  url: { type: 'string' },
                  service: { type: 'string' },
                },
              },
            },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: InitAgentBody }>,
      reply: FastifyReply
    ): Promise<void> => {
      const { user_id, account_id, api_key, api_key_prefix, systems } =
        request.body;

      const encryptionSecret = process.env.SECRET_INTERNAL_API_KEY;
      if (!encryptionSecret) {
        reply.code(500).send({ error: 'SECRET_INTERNAL_API_KEY is required' });
        return;
      }

      try {
        const clients = getClients(request);
        const encryptedApiKey = encrypt(api_key, encryptionSecret);

        const { agent } = await createAgent(clients, {
          userId: user_id,
          accountId: account_id,
        });

        await createSecret(clients, {
          accountId: account_id,
          name: 'Uvian Hub API Key',
          valueType: 'text',
          value: encryptedApiKey,
          metadata: { api_key_prefix },
        });

        const hubMcpUrl = `${request.headers.origin}/v1/mcp`;

        let mcpId: string;
        try {
          const { mcp } = await createMcp(clients, {
            accountId: account_id,
            name: 'Uvian Hub',
            type: 'external',
            authMethod: 'bearer',
            url: hubMcpUrl,
            config: {
              system: 'uvian-hub',
              description: 'Uvian Hub event and messaging MCP',
            },
          });
          mcpId = mcp.id;
        } catch (mcpErr: any) {
          if (mcpErr.message?.includes('duplicate') || mcpErr.code === '23505') {
            mcpId = 'existing';
          } else {
            throw mcpErr;
          }
        }

        await linkMcp(clients, {
          agentId: agent.id,
          mcpId,
          secretName: 'Uvian Hub API Key',
        });

        const systemConfigs = systems || DEFAULT_SYSTEM_CONFIGS;
        const resolvedSystems = systemConfigs
          .map((config) => ({
            ...config,
            url: config.url || getSystemUrl(config.name),
            name: getMcpDisplayName(config.name),
          }))
          .filter(
            (config): config is SystemConfig & { url: string } => !!config.url
          );

        const result = await configureAgent(agent.id, {
          mcps: resolvedSystems,
        });

        reply.send({
          success: true,
          message: 'Agent initialized',
          agentId: agent.id,
          mcps: result.mcps,
        });
      } catch (error: any) {
        reply
          .code(500)
          .send({ error: error.message || 'Failed to initialize agent' });
      }
    }
  );
}
