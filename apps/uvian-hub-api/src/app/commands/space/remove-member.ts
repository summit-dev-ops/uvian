import { ServiceClients } from '../../services/types';
import { createSpacesService } from '../../services/spaces';
import type {
  RemoveSpaceMemberCommandInput,
  RemoveSpaceMemberCommandOutput,
  CommandContext,
} from './types';

const spaceService = createSpacesService({});

export async function removeSpaceMember(
  clients: ServiceClients,
  input: RemoveSpaceMemberCommandInput,
  context?: CommandContext,
): Promise<RemoveSpaceMemberCommandOutput> {
  const result = await spaceService
    .scoped(clients)
    .removeMember(input.userId, input.spaceId, input.targetUserId);

  if (context?.eventEmitter) {
    context.eventEmitter.emitSpaceMemberLeft(
      {
        spaceId: input.spaceId,
        userId: input.targetUserId,
        removedBy: input.userId,
      },
      input.userId,
    );
  }

  return { success: result.success };
}
