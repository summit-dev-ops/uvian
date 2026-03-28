import {
  ServiceClients,
  AgentConfigAdminService,
  AgentConfigRecord,
} from './types';

export function createAgentConfigAdminService(
  _clients: ServiceClients
): AgentConfigAdminService {
  return {
    async getById(_agentId: string): Promise<AgentConfigRecord | null> {
      return null;
    },
  };
}
