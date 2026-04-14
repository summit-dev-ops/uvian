import { ServiceClients } from '../../services/types';
import { identityService } from '../../services';
import type { CommandContext } from '../types';

export interface CreateIdentityInput {
  userId: string;
  provider?: 'whatsapp' | 'slack' | 'telegram' | 'discord' | 'email';
  provider_user_id: string;
  metadata?: Record<string, unknown>;
}

export interface CreateIdentityOutput {
  identity: {
    id: string;
    user_id: string;
    provider: string;
    provider_user_id: string;
    metadata: Record<string, unknown> | null;
  };
}

export async function createIdentity(
  clients: ServiceClients,
  input: CreateIdentityInput,
  context?: CommandContext,
): Promise<CreateIdentityOutput> {
  const identity = await identityService
    .scoped(clients)
    .createIdentity(input.userId, {
      provider: input.provider || 'whatsapp',
      provider_user_id: input.provider_user_id,
      metadata: input.metadata,
      user_id: input.userId,
    });

  if (context?.eventEmitter) {
    context.eventEmitter.emitIdentityCreated(
      {
        identityId: identity.id,
        userId: input.userId,
        provider: identity.provider,
      },
      input.userId,
    );
  }

  return { identity };
}
