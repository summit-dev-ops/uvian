import { ServiceClients } from '../../services/types';
import { subscriptionService } from '../../services';
import type { CommandContext } from '../types';

export interface CreateSubscriptionInput {
  userId: string;
  resource_type: string;
  resource_id: string;
  is_active?: boolean;
}

export interface CreateSubscriptionOutput {
  subscription: {
    id: string;
    user_id: string;
    resource_type: string;
    resource_id: string;
    is_active: boolean;
  };
}

export async function createSubscription(
  clients: ServiceClients,
  input: CreateSubscriptionInput,
  context?: CommandContext,
): Promise<CreateSubscriptionOutput> {
  const subscription = await subscriptionService
    .scoped(clients)
    .createSubscription(input.userId, {
      resource_type: input.resource_type,
      resource_id: input.resource_id,
      is_active: input.is_active,
    });

  if (context?.eventEmitter) {
    context.eventEmitter.emitSubscriptionCreated(
      {
        subscriptionId: subscription.id,
        userId: subscription.user_id,
        resourceType: subscription.resource_type,
        resourceId: subscription.resource_id,
      },
      input.userId,
    );
  }

  return { subscription };
}
