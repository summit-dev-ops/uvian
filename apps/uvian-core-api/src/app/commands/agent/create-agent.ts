import { ServiceClients } from '../../services/types';
import { agentService } from '../../services';

export interface CreateAgentInput {
  userId: string;
  accountId: string;
  name: string;
}

export interface CreateAgentOutput {
  agent: {
    id: string;
    userId: string;
    accountId: string;
    name: string;
    email: string;
    apiKey?: string;
    createdAt: string;
  };
}

export async function createAgent(
  clients: ServiceClients,
  input: CreateAgentInput,
): Promise<CreateAgentOutput> {
  const agent = await agentService
    .scoped(clients)
    .createAgent(input.userId, input.accountId, input.name);

  return { agent };
}
