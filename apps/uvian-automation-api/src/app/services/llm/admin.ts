import { ServiceClients, LlmAdminService, LlmRecord } from './types';

export function createLlmAdminService(
  _clients: ServiceClients
): LlmAdminService {
  return {
    async getById(_llmId: string): Promise<LlmRecord | null> {
      return null;
    },
  };
}
