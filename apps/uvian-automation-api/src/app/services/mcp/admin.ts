import { ServiceClients, McpAdminService, McpRecord } from './types';

export function createMcpAdminService(
  _clients: ServiceClients
): McpAdminService {
  return {
    async getById(_mcpId: string): Promise<McpRecord | null> {
      return null;
    },
  };
}
