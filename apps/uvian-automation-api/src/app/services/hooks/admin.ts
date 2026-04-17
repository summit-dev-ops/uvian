import { ServiceClients, HookAdminService, HookRecord } from './types';

export function createHookAdminService(
  _clients: ServiceClients,
): HookAdminService {
  return {
    async getById(hookId: string): Promise<HookRecord | null> {
      return null;
    },
  };
}
