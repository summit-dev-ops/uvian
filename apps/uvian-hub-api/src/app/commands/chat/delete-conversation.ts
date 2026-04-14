import { ServiceClients } from '../../services/types';
import { createChatService } from '../../services/chat';
import type {
  DeleteConversationCommandInput,
  DeleteConversationCommandOutput,
  CommandContext,
} from './types';

const chatService = createChatService({});

export async function deleteConversation(
  clients: ServiceClients,
  input: DeleteConversationCommandInput,
  context?: CommandContext,
): Promise<DeleteConversationCommandOutput> {
  const result = await chatService
    .scoped(clients)
    .deleteConversation(input.userId, input.conversationId);

  if (context?.eventEmitter) {
    context.eventEmitter.emitConversationDeleted(
      { conversationId: input.conversationId, deletedBy: input.userId },
      input.userId,
    );
  }

  return { success: result.success };
}
