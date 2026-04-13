import { ServiceClients } from '../../services/types';
import { createSpacesService } from '../../services/spaces';
import type {
  CreateSpaceCommandInput,
  CreateSpaceCommandOutput,
  CommandContext,
} from './types';

const spaceService = createSpacesService({});

export async function createSpace(
  clients: ServiceClients,
  input: CreateSpaceCommandInput,
  context?: CommandContext,
): Promise<CreateSpaceCommandOutput> {
  const space = await spaceService.scoped(clients).createSpace(input.userId, {
    name: input.name,
    description: input.description,
    avatarUrl: input.avatarUrl,
    coverUrl: input.coverUrl,
    settings: input.settings,
    isPrivate: input.isPrivate,
  });

  if (context?.eventEmitter) {
    context.eventEmitter.emitSpaceCreated(
      {
        spaceId: space.id,
        name: space.name,
        createdBy: input.userId,
        memberIds: [input.userId],
      },
      input.userId,
    );
  }

  return { space };
}
