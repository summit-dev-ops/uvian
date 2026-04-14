import { ServiceClients } from '../../services/types';
import { externalPlatformService } from '../../services';

export interface UpdatePlatformInput {
  userId: string;
  platformId: string;
  name?: string;
  platform?:
    | 'discord'
    | 'slack'
    | 'whatsapp'
    | 'telegram'
    | 'messenger'
    | 'email';
  config?: Record<string, unknown>;
  is_active?: boolean;
}

export interface UpdatePlatformOutput {
  platform: {
    id: string;
    owner_user_id: string;
    name: string;
    platform: string;
    config: Record<string, unknown>;
    is_active: boolean;
  };
}

export async function updatePlatform(
  clients: ServiceClients,
  input: UpdatePlatformInput,
): Promise<UpdatePlatformOutput> {
  const platform = await externalPlatformService
    .scoped(clients)
    .updatePlatform(input.userId, input.platformId, {
      name: input.name,
      platform: input.platform,
      config: input.config,
      is_active: input.is_active,
    });

  return { platform };
}
