import { ServiceClients } from '../../services/types';
import { identityService } from '../../services';
import type { CommandContext } from '../types';

export interface UpdateIdentityInput {
  userId: string;
  identityId: string;
  provider?: 'whatsapp' | 'slack' | 'telegram' | 'discord' | 'email';
  provider_user_id?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateIdentityOutput {
  identity: {
    id: string;
    user_id: string;
    provider: string;
    provider_user_id: string;
    metadata: Record<string, unknown> | null;
  };
}

export async function updateIdentity(
  clients: ServiceClients,
  input: UpdateIdentityInput,
  context?: CommandContext,
): Promise<UpdateIdentityOutput> {
  const identity = await identityService
    .scoped(clients)
    .updateIdentity(input.userId, input.identityId, {
      provider: input.provider,
      provider_user_id: input.provider_user_id,
      metadata: input.metadata,
    });

  if (context?.eventEmitter) {
    context.eventEmitter.emitIdentityUpdated(
      { identityId: identity.id, userId: input.userId },
      input.userId,
    );
  }

  return { identity };
}
