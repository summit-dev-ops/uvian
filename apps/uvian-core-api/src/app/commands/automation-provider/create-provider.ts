import { ServiceClients } from '../../services/types';
import { automationProviderService } from '../../services';
import type { CommandContext } from '../types';

export interface CreateProviderInput {
  userId: string;
  accountId: string;
  name: string;
  type?: 'internal' | 'webhook';
  url?: string;
  auth_method?: 'none' | 'bearer' | 'api_key';
  auth_config?: Record<string, unknown>;
  is_active?: boolean;
}

export interface CreateProviderOutput {
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

export async function createProvider(
  clients: ServiceClients,
  input: CreateProviderInput,
  context?: CommandContext,
): Promise<CreateProviderOutput> {
  const provider = await automationProviderService
    .scoped(clients)
    .createProvider(input.userId, input.accountId, {
      account_id: input.accountId,
      owner_user_id: input.userId,
      name: input.name,
      type: input.type,
      url: input.url,
      auth_method: input.auth_method,
      auth_config: input.auth_config,
      is_active: input.is_active,
    });

  if (context?.eventEmitter) {
    context.eventEmitter.emitAutomationProviderCreated(
      {
        automationProviderId: provider.id,
        accountId: input.accountId,
        name: provider.name,
      },
      input.userId,
    );
  }

  return { provider };
}
