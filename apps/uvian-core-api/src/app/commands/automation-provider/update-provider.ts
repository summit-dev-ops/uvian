import { ServiceClients } from '../../services/types';
import { automationProviderService } from '../../services';
import type { CommandContext } from '../types';

export interface UpdateProviderInput {
  userId: string;
  providerId: string;
  accountId: string;
  name?: string;
  type?: 'internal' | 'webhook';
  url?: string;
  auth_method?: 'none' | 'bearer' | 'api_key';
  auth_config?: Record<string, unknown>;
  is_active?: boolean;
}

export interface UpdateProviderOutput {
  provider: {
    id: string;
    account_id: string;
    owner_user_id: string;
    name: string;
    type: string;
    url: string | null;
    auth_method: string | null;
    auth_config: Record<string, unknown> | null;
    is_active: boolean | null;
    created_at: string | null;
    updated_at: string | null;
  };
}

export async function updateProvider(
  clients: ServiceClients,
  input: UpdateProviderInput,
  context?: CommandContext,
): Promise<UpdateProviderOutput> {
  const provider = await automationProviderService
    .scoped(clients)
    .updateProvider(input.userId, input.providerId, input.accountId, {
      name: input.name,
      type: input.type,
      url: input.url,
      auth_method: input.auth_method,
      auth_config: input.auth_config,
      is_active: input.is_active,
    });

  if (context?.eventEmitter) {
    context.eventEmitter.emitAutomationProviderUpdated(
      { automationProviderId: provider.id, accountId: input.accountId },
      input.userId,
    );
  }

  return { provider };
}
