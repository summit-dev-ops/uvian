import { ServiceClients } from '../../services/types';
import { createSpacesService } from '../../services/spaces';
import type {
  DeleteSpaceCommandInput,
  DeleteSpaceCommandOutput,
  CommandContext,
} from './types';

const spaceService = createSpacesService({});

export async function deleteSpace(
  clients: ServiceClients,
  input: DeleteSpaceCommandInput,
  context?: CommandContext,
): Promise<DeleteSpaceCommandOutput> {
  const result = await spaceService
    .scoped(clients)
    .deleteSpace(input.userId, input.spaceId);

  if (context?.eventEmitter) {
    context.eventEmitter.emitSpaceDeleted(
      { spaceId: input.spaceId, deletedBy: input.userId },
      input.userId,
    );
  }

  return { success: result.success };
}
