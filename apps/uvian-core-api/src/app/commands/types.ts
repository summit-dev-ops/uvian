import type {
  AutomationProviderCreatedData,
  AutomationProviderUpdatedData,
  AutomationProviderDeletedData,
  SubscriptionCreatedData,
  SubscriptionDeletedData,
  IdentityCreatedData,
  IdentityUpdatedData,
  IdentityDeletedData,
} from '@org/uvian-events';

export interface CommandContext {
  eventEmitter?: {
    emitAutomationProviderCreated: (
      data: AutomationProviderCreatedData,
      actorId: string,
    ) => void;
    emitAutomationProviderUpdated: (
      data: AutomationProviderUpdatedData,
      actorId: string,
    ) => void;
    emitAutomationProviderDeleted: (
      data: AutomationProviderDeletedData,
      actorId: string,
    ) => void;
    emitSubscriptionCreated: (
      data: SubscriptionCreatedData,
      actorId: string,
    ) => void;
    emitSubscriptionDeleted: (
      data: SubscriptionDeletedData,
      actorId: string,
    ) => void;
    emitIdentityCreated: (data: IdentityCreatedData, actorId: string) => void;
    emitIdentityUpdated: (data: IdentityUpdatedData, actorId: string) => void;
    emitIdentityDeleted: (data: IdentityDeletedData, actorId: string) => void;
  };
}
