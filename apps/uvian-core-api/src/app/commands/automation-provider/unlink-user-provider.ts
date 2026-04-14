import { ServiceClients } from '../../services/types';
import { automationProviderService } from '../../services';

export interface UnlinkUserProviderInput {
  userId: string;
  providerLinkId: string;
}

export interface UnlinkUserProviderOutput {
  success: boolean;
}

export async function unlinkUserProvider(
  clients: ServiceClients,
  input: UnlinkUserProviderInput,
): Promise<UnlinkUserProviderOutput> {
  await automationProviderService
    .scoped(clients)
    .unlinkUserFromProvider(input.userId, input.providerLinkId);

  return { success: true };
}
