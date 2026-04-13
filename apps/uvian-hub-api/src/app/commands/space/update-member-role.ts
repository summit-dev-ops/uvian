import { ServiceClients } from '../../services/types';
import { createSpacesService } from '../../services/spaces';
import type {
  UpdateSpaceMemberRoleCommandInput,
  UpdateSpaceMemberRoleCommandOutput,
  CommandContext,
} from './types';

const spaceService = createSpacesService({});

export async function updateSpaceMemberRole(
  clients: ServiceClients,
  input: UpdateSpaceMemberRoleCommandInput,
  context?: CommandContext,
): Promise<UpdateSpaceMemberRoleCommandOutput> {
  const member = await spaceService
    .scoped(clients)
    .updateMemberRole(
      input.userId,
      input.spaceId,
      input.targetUserId,
      input.role,
    );

  if (context?.eventEmitter) {
    context.eventEmitter.emitSpaceMemberRoleChanged(
      {
        spaceId: input.spaceId,
        userId: input.targetUserId,
        oldRole: 'member',
        newRole: input.role.name as 'member' | 'moderator' | 'admin',
        changedBy: input.userId,
      },
      input.userId,
    );
  }

  return { member };
}
