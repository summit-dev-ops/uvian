import { agentConfigService } from '../services';
import type { ServiceClients } from '../services/llm/types';
import type { CommandContext } from './types';

export function getUserIdFromContext(context?: CommandContext): string {
  if (!context?.userId) {
    throw new Error('User ID not provided');
  }
  return context.userId;
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