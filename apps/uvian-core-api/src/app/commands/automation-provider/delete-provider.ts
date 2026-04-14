import { ServiceClients } from '../../services/types';
import { automationProviderService } from '../../services';
import type { CommandContext } from '../types';

export interface DeleteProviderInput {
  userId: string;
  providerId: string;
  accountId: string;
}

export interface DeleteProviderOutput {
  success: boolean;
}

export async function deleteProvider(
  clients: ServiceClients,
  input: DeleteProviderInput,
  context?: CommandContext,
): Promise<DeleteProviderOutput> {
  await automationProviderService
    .scoped(clients)
    .deleteProvider(input.userId, input.providerId, input.accountId);

  if (context?.eventEmitter) {
    context.eventEmitter.emitAutomationProviderDeleted(
      { automationProviderId: input.providerId, accountId: input.accountId },
      input.userId,
    );
  }

  return { success: true };
}
