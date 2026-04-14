import { ServiceClients } from '../../services/types';
import { createAccountsService } from '@org/services-accounts';
import type {
  CreateAccountCommandInput,
  CreateAccountCommandOutput,
  CommandContext,
} from './types';

const accountService = createAccountsService({});

export async function createAccount(
  clients: ServiceClients,
  input: CreateAccountCommandInput,
  context?: CommandContext,
): Promise<CreateAccountCommandOutput> {
  const account = await accountService
    .scoped(clients)
    .createAccount(input.userId, {
      name: input.name,
      settings: input.settings,
    });

  if (context?.eventEmitter) {
    context.eventEmitter.emitAccountCreated(
      {
        accountId: account.id,
        name: account.name || '',
        createdBy: input.userId,
      },
      input.userId,
    );
  }

  return { account };
}
