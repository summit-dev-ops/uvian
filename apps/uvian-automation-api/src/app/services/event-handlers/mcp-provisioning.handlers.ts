import { adminSupabase } from '../../clients/supabase.client';
import { mcpService, agentConfigService } from '../';
import {
  WebhookEnvelope,
  CoreEvents,
  McpProvisioningRequestedData,
} from '@org/uvian-events';

const clients = { adminClient: adminSupabase, userClient: adminSupabase };
const INTERNAL_API_KEY = process.env.SECRET_INTERNAL_API_KEY || '';

export function registerMcpProvisioningHandlers(webhookHandler: any) {
  webhookHandler.registerHandler(
    CoreEvents.MCP_PROVISIONING_REQUESTED,
    async (envelope: WebhookEnvelope) => {
      const payload = envelope.data as McpProvisioningRequestedData;

      console.log('MCP provisioning requested:', {
        agentId: payload.agentId,
        accountId: payload.accountId,
        mcpType: payload.mcpType,
        mcpName: payload.mcpName,
      });

      try {
        let mcpId = await findExistingMcp(payload.accountId, payload.mcpType);

        if (!mcpId) {
          mcpId = await createDiscordMcp(
            payload.accountId,
            payload.mcpName,
            payload.mcpUrl
          );
        }

        const baseUrl = payload.mcpUrl.replace(/\/v1\/mcp$/, '');
        const apiKey = await createApiKeyForAgent(payload.agentId, baseUrl);

        const { data: agentRecord, error: agentRecordError } =
          await adminSupabase
            .schema('core_automation')
            .from('agents')
            .select('id')
            .eq('user_id', payload.agentId)
            .single();

        if (agentRecordError || !agentRecord) {
          throw new Error(
            `Agent record not found for user ${payload.agentId}: ${agentRecordError?.message}`
          );
        }

        await linkMcpToAgent(agentRecord.id, mcpId, apiKey);

        console.log('MCP provisioning completed:', {
          agentId: payload.agentId,
          mcpId,
          mcpType: payload.mcpType,
        });
      } catch (error) {
        console.error('MCP provisioning failed:', error);
        throw error;
      }
    }
  );
}

async function findExistingMcp(
  accountId: string,
  mcpType: string
): Promise<string | null> {
  const { data } = await adminSupabase
    .schema('core_automation')
    .from('mcps')
    .select('id')
    .eq('account_id', accountId)
    .eq('config->>system', mcpType)
    .eq('is_active', true)
    .single();

  return data?.id || null;
}

async function createDiscordMcp(
  accountId: string,
  name: string,
  url: string
): Promise<string> {
  const mcp = await mcpService.scoped(clients).create({
    accountId,
    name,
    type: 'integrated',
    authMethod: 'bearer',
    url,
    config: { system: 'discord', description: 'Discord messaging MCP' },
  });

  return mcp.id;
}

async function createApiKeyForAgent(
  agentId: string,
  baseUrl: string
): Promise<string> {
  const response = await fetch(`${baseUrl}/api/auth/api-key`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': INTERNAL_API_KEY,
    },
    body: JSON.stringify({ userId: agentId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create API key: ${response.statusText}`);
  }

  const result = (await response.json()) as { apiKey: string };
  return result.apiKey;
}

async function linkMcpToAgent(
  agentId: string,
  mcpId: string,
  apiKey: string
): Promise<void> {
  await agentConfigService.scoped(clients).linkMcp(agentId, {
    mcpId,
    secretName: 'Discord MCP API Key',
    secretValue: apiKey,
  });
}
