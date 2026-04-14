import { ServiceClients } from '../../services/types';
import { externalPlatformService } from '../../services';

export interface CreatePlatformInput {
  userId: string;
  name: string;
  platform:
    | 'discord'
    | 'slack'
    | 'whatsapp'
    | 'telegram'
    | 'messenger'
    | 'email';
  config?: Record<string, unknown>;
  is_active?: boolean;
}

export interface CreatePlatformOutput {
  platform: {
    id: string;
    owner_user_id: string;
    name: string;
    platform: string;
    config: Record<string, unknown>;
    is_active: boolean;
  };
}

export async function createPlatform(
  clients: ServiceClients,
  input: CreatePlatformInput,
): Promise<CreatePlatformOutput> {
  const platform = await externalPlatformService
    .scoped(clients)
    .createPlatform(input.userId, {
      name: input.name,
      platform: input.platform,
      config: input.config,
      is_active: input.is_active,
    });

  return { platform };
}
