import { ServiceClients } from '../../services/types';
import { identityService } from '../../services';
import type { CommandContext } from '../types';

export interface DeleteIdentityInput {
  userId: string;
  identityId: string;
}

export interface DeleteIdentityOutput {
  success: boolean;
}

export async function deleteIdentity(
  clients: ServiceClients,
  input: DeleteIdentityInput,
  context?: CommandContext,
): Promise<DeleteIdentityOutput> {
  await identityService
    .scoped(clients)
    .deleteIdentity(input.userId, input.identityId);

  if (context?.eventEmitter) {
    context.eventEmitter.emitIdentityDeleted(
      { identityId: input.identityId, userId: input.userId },
      input.userId,
    );
  }

  return { success: true };
}
