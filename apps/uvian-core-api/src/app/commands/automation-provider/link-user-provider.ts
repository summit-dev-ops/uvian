import { ServiceClients } from '../../services/types';
import { automationProviderService } from '../../services';

export interface LinkUserProviderInput {
  userId: string;
  automationProviderId: string;
}

export interface LinkUserProviderOutput {
  userAutomationProvider: {
    id: string;
    user_id: string;
    automation_provider_id: string;
  };
}

export async function linkUserProvider(
  clients: ServiceClients,
  input: LinkUserProviderInput,
): Promise<LinkUserProviderOutput> {
  const userAutomationProvider = await automationProviderService
    .scoped(clients)
    .linkUserToProvider(input.userId, input.automationProviderId);

  return { userAutomationProvider };
}
