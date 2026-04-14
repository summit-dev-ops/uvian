import { ServiceClients } from '../../services/types';
import { createChatService } from '../../services/chat';
import type {
  UpdateConversationMemberRoleCommandInput,
  UpdateConversationMemberRoleCommandOutput,
  CommandContext,
} from './types';

const chatService = createChatService({});

export async function updateConversationMemberRole(
  clients: ServiceClients,
  input: UpdateConversationMemberRoleCommandInput,
  context?: CommandContext,
): Promise<UpdateConversationMemberRoleCommandOutput> {
  const member = await chatService
    .scoped(clients)
    .updateMemberRole(
      input.userId,
      input.conversationId,
      input.targetUserId,
      input.role,
    );

  if (context?.eventEmitter) {
    context.eventEmitter.emitConversationMemberRoleChanged(
      {
        conversationId: input.conversationId,
        userId: input.targetUserId,
        oldRole: 'member',
        newRole: input.role.name,
        changedBy: input.userId,
      },
      input.userId,
    );
  }

  return { member };
}
