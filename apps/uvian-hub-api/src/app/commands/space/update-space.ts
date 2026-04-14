import { ServiceClients } from '../../services/types';
import { createSpacesService } from '../../services/spaces';
import type {
  UpdateSpaceCommandInput,
  UpdateSpaceCommandOutput,
  CommandContext,
} from './types';

const spaceService = createSpacesService({});

export async function updateSpace(
  clients: ServiceClients,
  input: UpdateSpaceCommandInput,
  context?: CommandContext,
): Promise<UpdateSpaceCommandOutput> {
  const space = await spaceService
    .scoped(clients)
    .updateSpace(input.userId, input.spaceId, {
      name: input.name,
      description: input.description,
      avatarUrl: input.avatarUrl,
      coverUrl: input.coverUrl,
      settings: input.settings,
      isPrivate: input.isPrivate,
    });

  if (context?.eventEmitter) {
    context.eventEmitter.emitSpaceUpdated(
      {
        spaceId: input.spaceId,
        updatedBy: input.userId,
        name: space.name,
      },
      input.userId,
    );
  }

  return { space };
}
