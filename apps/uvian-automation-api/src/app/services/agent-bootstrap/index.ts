import { adminSupabase } from '../../clients/supabase.client';
import { agentConfigService, llmService } from '../';

const INTERNAL_API_KEY = process.env.SECRET_INTERNAL_API_KEY || '';

export interface SystemConfig {
  name: string;
  url: string;
  service: string;
  apiKey?: string;
}

export interface LlmConfig {
  name: string;
  type: string;
  modelName: string;
  baseUrl?: string;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
  isDefault?: boolean;
  config?: Record<string, unknown>;
}

export interface BootstrapResult {
  success: boolean;
  name: string;
  error?: string;
}

export interface ConfigureAgentResult {
  agentId: string;
  mcps: BootstrapResult[];
  llms: BootstrapResult[];
}

const clients = { adminClient: adminSupabase, userClient: adminSupabase };

async function bootstrapMcps(
  agentId: string,
  accountId: string,
  userId: string,
  systems: SystemConfig[],
): Promise<BootstrapResult[]> {
  const results: BootstrapResult[] = [];

  for (const config of systems) {
    try {
      const upsertResult = await adminSupabase
        .schema('core_automation')
        .from('mcps')
        .upsert(
          {
            account_id: accountId,
            name: config.name,
            type: config.apiKey ? 'external' : 'integrated',
            auth_method: 'bearer',
            url: config.url,
            config: {
              system: config.service,
              description: `${config.name} MCP`,
            },
            is_active: true,
          },
          { onConflict: 'account_id,name' },
        )
        .select()
        .single();

      if (upsertResult.error) {
        throw new Error(`Failed to upsert MCP: ${upsertResult.error.message}`);
      }

      const mcp = upsertResult.data;

      const { data: existingLink } = await adminSupabase
        .schema('core_automation')
        .from('agent_mcps')
        .select('agent_id')
        .eq('agent_id', agentId)
        .eq('mcp_id', mcp.id)
        .single();

      if (existingLink) {
        results.push({ success: true, name: config.name });
        continue;
      }

      let apiKey: string;
      if (config.apiKey) {
        apiKey = config.apiKey;
      } else {
        const response = await fetch(`${config.url}/api/auth/api-key`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': INTERNAL_API_KEY,
          },
          body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to create API key: ${errorText}`);
        }

        const data = (await response.json()) as { apiKey: string };
        apiKey = data.apiKey;
      }

      await agentConfigService.scoped(clients).linkMcp(agentId, {
        mcpId: mcp.id,
        secretName: `${config.name} API Key`,
        secretValue: apiKey,
      });

      results.push({ success: true, name: config.name });
    } catch (error: any) {
      console.error(`Failed to bootstrap MCP ${config.name}:`, error);
      results.push({
        success: false,
        name: config.name,
        error: error.message,
      });
    }
  }

  return results;
}

async function bootstrapLlms(
  agentId: string,
  accountId: string,
  llmConfigs: LlmConfig[],
): Promise<BootstrapResult[]> {
  const results: BootstrapResult[] = [];

  for (const config of llmConfigs) {
    try {
      const { data: existingLlm } = await adminSupabase
        .schema('core_automation')
        .from('llms')
        .select('id')
        .eq('base_url', config.baseUrl)
        .eq('model_name', config.modelName)
        .eq('account_id', accountId)
        .single();

      let llmId: string;

      if (existingLlm) {
        llmId = existingLlm.id;
      } else {
        const created = await llmService.scoped(clients).create(accountId, {
          name: config.name,
          type: config.type,
          provider: config.type,
          modelName: config.modelName,
          baseUrl: config.baseUrl,
          temperature: config.temperature ?? 0.7,
          maxTokens: config.maxTokens,
          isDefault: config.isDefault ?? false,
          config: config.config,
        });
        llmId = created.id;
      }

      const { data: existingLink } = await adminSupabase
        .schema('core_automation')
        .from('agent_llms')
        .select('agent_id')
        .eq('agent_id', agentId)
        .eq('llm_id', llmId)
        .single();

      if (existingLink) {
        results.push({ success: true, name: config.name });
        continue;
      }

      await agentConfigService.scoped(clients).linkLlm(agentId, {
        llmId,
        secretName: `${config.name} API Key`,
        secretValue: config.apiKey,
        isDefault: config.isDefault,
      });

      results.push({ success: true, name: config.name });
    } catch (error: any) {
      console.error(`Failed to bootstrap LLM ${config.name}:`, error);
      results.push({
        success: false,
        name: config.name,
        error: error.message,
      });
    }
  }

  return results;
}

export async function configureAgent(
  agentId: string,
  config: { mcps?: SystemConfig[]; llms?: LlmConfig[] },
): Promise<ConfigureAgentResult> {
  const { data: agent, error } = await adminSupabase
    .schema('core_automation')
    .from('agents')
    .select('id, account_id, user_id')
    .eq('id', agentId)
    .single();

  if (error || !agent) {
    throw new Error('Agent not found');
  }

  const [mcpResults, llmResults] = await Promise.all([
    config.mcps
      ? bootstrapMcps(agentId, agent.account_id, agent.user_id, config.mcps)
      : Promise.resolve([]),
    config.llms
      ? bootstrapLlms(agentId, agent.account_id, config.llms)
      : Promise.resolve([]),
  ]);

  return { agentId, mcps: mcpResults, llms: llmResults };
}
