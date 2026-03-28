import { ServiceClients, JobAdminService, JobRecord } from './types';

export function createJobAdminService(
  _clients: ServiceClients
): JobAdminService {
  return {
    async getById(_jobId: string): Promise<JobRecord | null> {
      return null;
    },
  };
}
