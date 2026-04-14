import { ServiceClients } from '../../services/types';
import { createAccountsService } from '@org/services-accounts';
import type {
  RemoveAccountMemberCommandInput,
  RemoveAccountMemberCommandOutput,
  CommandContext,
} from './types';

const accountService = createAccountsService({});

export async function removeAccountMember(
  clients: ServiceClients,
  input: RemoveAccountMemberCommandInput,
  context?: CommandContext,
): Promise<RemoveAccountMemberCommandOutput> {
  await accountService
    .scoped(clients)
    .removeAccountMember(input.accountId, input.userId, input.targetUserId);

  if (context?.eventEmitter) {
    context.eventEmitter.emitAccountMemberRemoved(
      {
        accountId: input.accountId,
        userId: input.targetUserId,
        removedBy: input.userId,
      },
      input.userId,
    );
  }

  return { success: true };
}
