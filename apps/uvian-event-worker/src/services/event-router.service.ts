import { CloudEvent } from '@org/uvian-events';
import {
  IntakeEvents,
  MessagingEvents,
  SpaceEvents,
  AccountEvents,
  CoreEvents,
} from '@org/uvian-events';
import {
  subscriptionService,
  SubscriptionProvider,
} from './subscription.service';

const AUTOMATION_API_URL =
  process.env.UVIAN_AUTOMATION_API_URL || 'http://localhost:3001';
const AUTOMATION_API_KEY =
  process.env.UVIAN_AUTOMATION_API_KEY || 'dev-internal-api-key-change-in-prod';

interface SourcePath {
  type: string;
  id: string;
}

type ResourceType =
  | 'conversation'
  | 'space'
  | 'intake'
  | 'job'
  | 'ticket'
  | 'user'
  | 'account'
  | 'agent';

const RESOURCE_TYPE_MAP: Record<string, ResourceType> = {
  conversations: 'conversation',
  spaces: 'space',
  intakes: 'intake',
  jobs: 'job',
  tickets: 'ticket',
  users: 'user',
  accounts: 'account',
  agents: 'agent',
};

const MEMBER_EVENT_TYPES = [
  MessagingEvents.CONVERSATION_MEMBER_JOINED,
  MessagingEvents.CONVERSATION_MEMBER_LEFT,
  SpaceEvents.SPACE_MEMBER_JOINED,
  SpaceEvents.SPACE_MEMBER_LEFT,
  SpaceEvents.SPACE_MEMBER_ROLE_CHANGED,
  AccountEvents.ACCOUNT_MEMBER_ROLE_CHANGED,
];

const INTAKE_EVENT_TYPES = [
  IntakeEvents.INTAKE_CREATED,
  IntakeEvents.INTAKE_COMPLETED,
  IntakeEvents.INTAKE_REVOKED,
];

const AUTOMATION_PROVIDER_EVENTS = [
  CoreEvents.AUTOMATION_PROVIDER_CREATED,
  CoreEvents.AUTOMATION_PROVIDER_UPDATED,
  CoreEvents.AUTOMATION_PROVIDER_DELETED,
];

const SUBSCRIPTION_EVENTS = [
  CoreEvents.SUBSCRIPTION_CREATED,
  CoreEvents.SUBSCRIPTION_DELETED,
];

export class EventRouter {
  async processEvent(event: CloudEvent): Promise<void> {
    console.log('[EventRouter] Processing event:', event.type, event.source);

    if (this.isAutomationProviderEvent(event.type)) {
      console.log(
        '[EventRouter] Automation provider event detected, invalidating related caches'
      );
      const data = event.data as { automationProviderId?: string };
      if (data.automationProviderId) {
        await subscriptionService.invalidateCacheForProvider(
          data.automationProviderId
        );
      }
      return;
    }

    const sourcePath = this.parseSource(event.source);
    if (!sourcePath) {
      console.log('[EventRouter] Could not parse source path:', event.source);
      return;
    }

    const resourceType = RESOURCE_TYPE_MAP[sourcePath.type];
    if (!resourceType) {
      console.log(
        '[EventRouter] Resource type not subscribable:',
        sourcePath.type
      );
      return;
    }

    if (this.isSubscriptionEvent(event.type)) {
      console.log(
        '[EventRouter] Subscription event detected, invalidating cache'
      );
      await subscriptionService.invalidateCache(resourceType, sourcePath.id);
      return;
    }

    if (this.isMemberEvent(event.type)) {
      console.log('[EventRouter] Member event detected, invalidating cache');
      await subscriptionService.invalidateCache(resourceType, sourcePath.id);
      return;
    }

    if (this.isIntakeEvent(event.type)) {
      console.log('[EventRouter] Intake event detected:', event.type);
      await this.processIntakeEvent(event);
      return;
    }

    await this.routeToSubscribers(event, resourceType, sourcePath.id);
  }

  private parseSource(source: string): SourcePath | null {
    if (!source || !source.startsWith('/')) {
      return null;
    }

    const parts = source.slice(1).split('/');
    if (parts.length < 2) {
      return null;
    }

    const type = parts[0];
    const id = parts.slice(1).join('/');

    return { type, id };
  }

  private isMemberEvent(eventType: string): boolean {
    return MEMBER_EVENT_TYPES.includes(
      eventType as (typeof MEMBER_EVENT_TYPES)[number]
    );
  }

  private isAutomationProviderEvent(eventType: string): boolean {
    return AUTOMATION_PROVIDER_EVENTS.includes(
      eventType as (typeof AUTOMATION_PROVIDER_EVENTS)[number]
    );
  }

  private isSubscriptionEvent(eventType: string): boolean {
    return SUBSCRIPTION_EVENTS.includes(
      eventType as (typeof SUBSCRIPTION_EVENTS)[number]
    );
  }

  private isIntakeEvent(eventType: string): boolean {
    return INTAKE_EVENT_TYPES.includes(eventType as any);
  }

  private async processIntakeEvent(event: CloudEvent): Promise<void> {
    const intakeId = event.subject as string;
    console.log(
      '[EventRouter] Processing intake event:',
      event.type,
      'intakeId:',
      intakeId
    );

    try {
      const providers = await subscriptionService.getProvidersForResource(
        'intake',
        intakeId
      );

      if (providers.length === 0) {
        console.log(
          '[EventRouter] No providers subscribed to intake/',
          intakeId
        );
        return;
      }

      console.log(
        '[EventRouter] Routing intake event to',
        providers.length,
        'provider(s)'
      );

      const routingPromises = providers.map((provider) =>
        this.routeToProvider(provider, event).catch((error) => {
          console.error(
            '[EventRouter] Error routing to provider',
            provider.provider_id,
            ':',
            error
          );
        })
      );

      await Promise.all(routingPromises);
    } catch (error) {
      console.error('[EventRouter] Error processing intake event:', error);
    }
  }

  private async routeToSubscribers(
    event: CloudEvent,
    resourceType: ResourceType,
    resourceId: string
  ): Promise<void> {
    let providers: SubscriptionProvider[];

    try {
      providers = await subscriptionService.getProvidersForResource(
        resourceType,
        resourceId
      );
    } catch (error) {
      console.error('[EventRouter] Error fetching providers:', error);
      return;
    }

    if (providers.length === 0) {
      console.log(
        `[EventRouter] No providers subscribed to ${resourceType}/${resourceId}`
      );
      return;
    }

    console.log(
      `[EventRouter] Routing event to ${providers.length} provider(s)`
    );

    const routingPromises = providers.map((provider) =>
      this.routeToProvider(provider, event).catch((error) => {
        console.error(
          `[EventRouter] Error routing to provider ${provider.provider_id}:`,
          error
        );
      })
    );

    await Promise.all(routingPromises);
  }

  private async routeToProvider(
    provider: SubscriptionProvider,
    event: CloudEvent
  ): Promise<void> {
    console.log(
      `[EventRouter] Routing to provider: ${provider.provider_name} (${provider.type})`
    );

    if (provider.type === 'internal') {
      await this.sendToInternalProvider(provider, event);
    } else if (provider.type === 'webhook') {
      await this.sendToWebhookProvider(provider, event);
    } else {
      console.warn(`[EventRouter] Unknown provider type: ${provider.type}`);
    }
  }

  private async sendToInternalProvider(
    provider: SubscriptionProvider,
    event: CloudEvent
  ): Promise<void> {
    const url = `${AUTOMATION_API_URL}/api/webhooks/agents/${provider.dependent_user_id}/events`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': AUTOMATION_API_KEY,
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(
        `[EventRouter] Successfully sent to internal provider ${provider.provider_id}`
      );
    } catch (error) {
      console.error(
        `[EventRouter] Failed to send to internal provider ${provider.provider_id}:`,
        error
      );
      throw error;
    }
  }

  private async sendToWebhookProvider(
    provider: SubscriptionProvider,
    event: CloudEvent
  ): Promise<void> {
    if (!provider.url) {
      console.warn(
        `[EventRouter] Webhook provider ${provider.provider_id} has no URL`
      );
      return;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (provider.auth_method === 'bearer' && provider.auth_config?.token) {
      headers['Authorization'] = `Bearer ${provider.auth_config.token}`;
    } else if (
      provider.auth_method === 'api_key' &&
      provider.auth_config?.apiKey
    ) {
      headers['X-API-Key'] = provider.auth_config.apiKey as string;
    }

    try {
      const response = await fetch(provider.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(
        `[EventRouter] Successfully sent to webhook provider ${provider.provider_id}`
      );
    } catch (error) {
      console.error(
        `[EventRouter] Failed to send to webhook provider ${provider.provider_id}:`,
        error
      );
      throw error;
    }
  }
}

export const eventRouter = new EventRouter();
