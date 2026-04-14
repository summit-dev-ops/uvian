import { ServiceClients } from '../../services/types';
import { createSpacesService } from '../../services/spaces';
import type {
  InviteSpaceMemberCommandInput,
  InviteSpaceMemberCommandOutput,
  CommandContext,
} from './types';

const spaceService = createSpacesService({});

export async function inviteSpaceMember(
  clients: ServiceClients,
  input: InviteSpaceMemberCommandInput,
  context?: CommandContext,
): Promise<InviteSpaceMemberCommandOutput> {
  const member = await spaceService
    .scoped(clients)
    .inviteMember(
      input.userId,
      input.spaceId,
      input.targetUserId,
      input.role || { name: 'member' },
    );

  if (context?.eventEmitter) {
    context.eventEmitter.emitSpaceMemberJoined(
      {
        spaceId: input.spaceId,
        userId: input.targetUserId,
        role:
          (input.role?.name as 'member' | 'moderator' | 'admin') || 'member',
        invitedBy: input.userId,
      },
      input.userId,
    );
  }

  return { member };
}
