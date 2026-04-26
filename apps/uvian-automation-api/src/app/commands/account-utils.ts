import { agentConfigService } from '../services';
import type { ServiceClients } from '../services/llm/types';

export async function getUserIdFromClient(
  clients: ServiceClients,
): Promise<string> {
  const {
    data: { user },
    error,
  } = await clients.userClient.auth.getUser();
  if (error || !user) {
    throw new Error('Unable to get authenticated user');
  }
  return user.id;
}

export async function getAccountIdFromUserId(
  clients: ServiceClients,
  userId: string,
): Promise<string> {
  const agent = await agentConfigService
    .scoped(clients)
    .getByUserId(userId);
  if (!agent) {
    throw new Error('Agent not found for user');
  }
  return agent.accountId;
}