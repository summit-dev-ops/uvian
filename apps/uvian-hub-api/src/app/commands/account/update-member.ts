import { ServiceClients } from '../../services/types';
import { createAccountsService } from '@org/services-accounts';
import type {
  UpdateAccountMemberCommandInput,
  UpdateAccountMemberCommandOutput,
  CommandContext,
} from './types';

const accountService = createAccountsService({});

export async function updateAccountMember(
  clients: ServiceClients,
  input: UpdateAccountMemberCommandInput,
  context?: CommandContext,
): Promise<UpdateAccountMemberCommandOutput> {
  const member = await accountService
    .scoped(clients)
    .updateAccountMember(
      input.accountId,
      input.userId,
      input.targetUserId,
      input.role,
    );

  if (context?.eventEmitter) {
    context.eventEmitter.emitAccountMemberRoleChanged(
      {
        accountId: input.accountId,
        userId: input.targetUserId,
        oldRole: 'member',
        newRole: (input.role.name as 'member' | 'admin') || 'member',
        changedBy: input.userId,
      },
      input.userId,
    );
  }

  return { member };
}
