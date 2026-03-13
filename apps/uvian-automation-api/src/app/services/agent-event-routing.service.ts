import { adminSupabase } from '../clients/supabase.client';
import { WebhookEnvelope } from '@org/uvian-events';

interface AgentConfig {
  id: string;
  agent_user_id: string;
  account_id: string;
  automation_provider_id: string;
  subscribed_events: string[];
  is_active: boolean;
}

interface AutomationProvider {
  id: string;
  account_id: string;
  type: 'internal' | 'webhook';
  url: string | null;
  auth_method: 'none' | 'bearer' | 'api_key';
  auth_config: Record<string, any>;
}

export class AgentEventRoutingService {
  async routeEventToAgents(envelope: WebhookEnvelope): Promise<void> {
    const eventType = envelope.type;

    try {
      const { data: agents, error } = await adminSupabase
        .from('agent_configs')
        .select(
          'id, agent_user_id, account_id, automation_provider_id, subscribed_events, is_active'
        )
        .eq('is_active', true);

      if (error) {
        console.error('Failed to fetch agent configs:', error);
        return;
      }

      const relevantAgents = (agents || []).filter(
        (agent: AgentConfig) =>
          agent.subscribed_events &&
          Array.isArray(agent.subscribed_events) &&
          agent.subscribed_events.includes(eventType)
      );

      if (relevantAgents.length === 0) {
        console.log(`No agents subscribed to event type: ${eventType}`);
        return;
      }

      const providerIds = [
        ...new Set(
          relevantAgents.map((a: AgentConfig) => a.automation_provider_id)
        ),
      ];

      const { data: providers } = await adminSupabase
        .from('automaton_providers')
        .select('id, account_id, type, url, auth_method, auth_config')
        .in('id', providerIds)
        .eq('is_active', true);

      for (const agent of relevantAgents) {
        const provider = (providers || []).find(
          (p: AutomationProvider) => p.id === agent.automation_provider_id
        );

        if (!provider) {
          console.warn(`No provider found for agent: ${agent.id}`);
          continue;
        }

        const agentEnvelope = {
          ...envelope,
          targetAgentId: agent.agent_user_id,
        };

        await this.sendToProvider(provider, agentEnvelope);
      }
    } catch (error) {
      console.error('Error routing event to agents:', error);
    }
  }

  private async sendToProvider(
    provider: AutomationProvider,
    envelope: WebhookEnvelope
  ): Promise<void> {
    if (provider.type === 'internal') {
      await this.sendToInternalProvider(envelope);
    } else if (provider.type === 'webhook' && provider.url) {
      await this.sendToWebhookProvider(provider, envelope);
    }
  }

  private async sendToInternalProvider(
    envelope: WebhookEnvelope
  ): Promise<void> {
    const automationApiUrl =
      process.env.AUTOMATION_API_URL || 'http://localhost:3001';

    try {
      const response = await fetch(`${automationApiUrl}/api/webhooks/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.AUTOMATION_API_KEY || '',
        },
        body: JSON.stringify(envelope),
      });

      if (!response.ok) {
        console.error(
          `Failed to send to internal provider: ${response.status}`
        );
      }
    } catch (error) {
      console.error('Error sending to internal provider:', error);
    }
  }

  private async sendToWebhookProvider(
    provider: AutomationProvider,
    envelope: WebhookEnvelope
  ): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (provider.auth_method === 'bearer' && provider.auth_config?.token) {
      headers['Authorization'] = `Bearer ${provider.auth_config.token}`;
    } else if (
      provider.auth_method === 'api_key' &&
      provider.auth_config?.key
    ) {
      headers['X-API-Key'] = provider.auth_config.key;
    }

    try {
      const response = await fetch(provider.url!, {
        method: 'POST',
        headers,
        body: JSON.stringify(envelope),
      });

      if (!response.ok) {
        console.error(`Failed to send to webhook provider: ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending to webhook provider:', error);
    }
  }
}

export const agentEventRoutingService = new AgentEventRoutingService();
