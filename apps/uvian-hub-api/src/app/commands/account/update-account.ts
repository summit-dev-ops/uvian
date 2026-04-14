import { ServiceClients } from '../../services/types';
import { createAccountsService } from '@org/services-accounts';
import type {
  UpdateAccountCommandInput,
  UpdateAccountCommandOutput,
  CommandContext,
} from './types';

const accountService = createAccountsService({});

export async function updateAccount(
  clients: ServiceClients,
  input: UpdateAccountCommandInput,
  context?: CommandContext,
): Promise<UpdateAccountCommandOutput> {
  const account = await accountService
    .scoped(clients)
    .updateAccount(input.accountId, input.userId, {
      name: input.name,
      settings: input.settings,
    });

  if (context?.eventEmitter) {
    context.eventEmitter.emitAccountUpdated(
      { accountId: input.accountId, updatedBy: input.userId, name: input.name },
      input.userId,
    );
  }

  return { account };
}
