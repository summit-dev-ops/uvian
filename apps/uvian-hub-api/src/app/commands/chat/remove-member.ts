import { ServiceClients } from '../../services/types';
import { createChatService } from '../../services/chat';
import type {
  RemoveConversationMemberCommandInput,
  RemoveConversationMemberCommandOutput,
  CommandContext,
} from './types';

const chatService = createChatService({});

export async function removeConversationMember(
  clients: ServiceClients,
  input: RemoveConversationMemberCommandInput,
  context?: CommandContext,
): Promise<RemoveConversationMemberCommandOutput> {
  const result = await chatService
    .scoped(clients)
    .removeMember(input.userId, input.conversationId, input.targetUserId);

  if (context?.eventEmitter) {
    context.eventEmitter.emitConversationMemberLeft(
      {
        conversationId: input.conversationId,
        userId: input.targetUserId,
        removedBy: input.userId,
      },
      input.userId,
    );
  }

  return { success: result.success };
}
