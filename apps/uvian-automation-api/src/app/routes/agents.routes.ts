import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { adminSupabase } from '../clients/supabase.client';
import { encrypt } from '@org/utils-encryption';
import { configureAgent } from '../services';

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
        const encryptedApiKey = encrypt(api_key, encryptionSecret);

        const { data: agent, error: agentError } = await adminSupabase
          .schema('core_automation')
          .from('agents')
          .insert({
            user_id,
            account_id,
            is_active: true,
          })
          .select('id')
          .single();

        if (agentError) {
          reply.code(400).send({ error: agentError.message });
          return;
        }

        const secret = await adminSupabase
          .schema('public')
          .from('secrets')
          .insert({
            account_id,
            name: 'Uvian Hub API Key',
            value_type: 'text',
            encrypted_value: encryptedApiKey,
            metadata: { api_key_prefix },
            is_active: true,
          })
          .select()
          .single();

        if (secret.error) {
          reply.code(400).send({ error: secret.error.message });
          return;
        }

        const hubMcpUrl = `${request.headers.origin}/v1/mcp`;

        const { data: hubMcp, error: mcpError } = await adminSupabase
          .schema('core_automation')
          .from('mcps')
          .upsert(
            {
              account_id,
              name: 'Uvian Hub',
              type: 'external',
              auth_method: 'bearer',
              url: hubMcpUrl,
              config: {
                system: 'uvian-hub',
                description: 'Uvian Hub event and messaging MCP',
              },
              is_active: true,
            },
            { onConflict: 'account_id,name' }
          )
          .select()
          .single();

        if (mcpError) {
          reply.code(400).send({ error: mcpError.message });
          return;
        }

        const { error: linkError } = await adminSupabase
          .schema('core_automation')
          .from('agent_mcps')
          .insert({
            agent_id: agent.id,
            mcp_id: hubMcp.id,
            secret_id: secret.data.id,
          });

        if (linkError) {
          reply.code(400).send({ error: linkError.message });
          return;
        }

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
