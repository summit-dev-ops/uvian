import { ServiceClients } from '../../services/types';
import { agentService } from '../../services';

export interface DeleteAgentInput {
  userId: string;
  agentId: string;
  accountId: string;
}

export interface DeleteAgentOutput {
  success: boolean;
}

export async function deleteAgent(
  clients: ServiceClients,
  input: DeleteAgentInput,
): Promise<DeleteAgentOutput> {
  await agentService
    .scoped(clients)
    .deleteAgent(input.userId, input.agentId, input.accountId);

  return { success: true };
}
