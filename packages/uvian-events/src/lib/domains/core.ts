import { EVENT_TYPE_PREFIX } from '../constants';

const prefix = EVENT_TYPE_PREFIX;

export const CoreEvents = {
  AUTOMATION_PROVIDER_CREATED: `${prefix}.core.automation-provider.created`,
  AUTOMATION_PROVIDER_UPDATED: `${prefix}.core.automation-provider.updated`,
  AUTOMATION_PROVIDER_DELETED: `${prefix}.core.automation-provider.deleted`,
  SUBSCRIPTION_CREATED: `${prefix}.core.subscription.created`,
  SUBSCRIPTION_DELETED: `${prefix}.core.subscription.deleted`,
  IDENTITY_CREATED: `${prefix}.core.identity.created`,
  IDENTITY_UPDATED: `${prefix}.core.identity.updated`,
  IDENTITY_DELETED: `${prefix}.core.identity.deleted`,
  MCP_PROVISIONING_REQUESTED: `${prefix}.core.mcp-provisioning.requested`,
} as const;

export type CoreEventType = (typeof CoreEvents)[keyof typeof CoreEvents];

export interface AutomationProviderCreatedData {
  automationProviderId: string;
  accountId: string;
  name: string;
}

export interface AutomationProviderUpdatedData {
  automationProviderId: string;
  accountId: string;
}

export interface AutomationProviderDeletedData {
  automationProviderId: string;
  accountId: string;
}

export interface SubscriptionCreatedData {
  subscriptionId: string;
  userId: string;
  resourceType: string;
  resourceId: string;
}

export interface SubscriptionDeletedData {
  subscriptionId: string;
  userId: string;
}

export interface IdentityCreatedData {
  identityId: string;
  userId: string;
  provider: string;
}

export interface IdentityUpdatedData {
  identityId: string;
  userId: string;
}

export interface IdentityDeletedData {
  identityId: string;
  userId: string;
}

export interface McpProvisioningRequestedData {
  agentId: string;
  accountId: string;
  mcpType: string;
  mcpUrl: string;
  mcpName: string;
}

export type CoreEventData =
  | AutomationProviderCreatedData
  | AutomationProviderUpdatedData
  | AutomationProviderDeletedData
  | SubscriptionCreatedData
  | SubscriptionDeletedData
  | IdentityCreatedData
  | IdentityUpdatedData
  | IdentityDeletedData
  | McpProvisioningRequestedData;
