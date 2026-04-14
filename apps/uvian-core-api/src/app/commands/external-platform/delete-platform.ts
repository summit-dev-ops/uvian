import { ServiceClients } from '../../services/types';
import { externalPlatformService } from '../../services';

export interface DeletePlatformInput {
  userId: string;
  platformId: string;
}

export interface DeletePlatformOutput {
  success: boolean;
}

export async function deletePlatform(
  clients: ServiceClients,
  input: DeletePlatformInput,
): Promise<DeletePlatformOutput> {
  await externalPlatformService
    .scoped(clients)
    .deletePlatform(input.userId, input.platformId);

  return { success: true };
}
