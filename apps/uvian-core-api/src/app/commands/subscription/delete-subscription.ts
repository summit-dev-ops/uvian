import { ServiceClients } from '../../services/types';
import { subscriptionService } from '../../services';
import type { CommandContext } from '../types';

export interface DeleteSubscriptionInput {
  userId: string;
  subscriptionId: string;
}

export interface DeleteSubscriptionOutput {
  success: boolean;
}

export async function deleteSubscription(
  clients: ServiceClients,
  input: DeleteSubscriptionInput,
  context?: CommandContext,
): Promise<DeleteSubscriptionOutput> {
  await subscriptionService
    .scoped(clients)
    .deleteSubscription(input.userId, input.subscriptionId);

  if (context?.eventEmitter) {
    context.eventEmitter.emitSubscriptionDeleted(
      { subscriptionId: input.subscriptionId, userId: input.userId },
      input.userId,
    );
  }

  return { success: true };
}
