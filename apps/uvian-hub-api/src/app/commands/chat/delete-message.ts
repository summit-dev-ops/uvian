import { ServiceClients } from '../../services/types';
import { createChatService } from '../../services/chat';
import type {
  DeleteMessageCommandInput,
  DeleteMessageCommandOutput,
  CommandContext,
} from './types';

const chatService = createChatService({});

export async function deleteMessage(
  clients: ServiceClients,
  input: DeleteMessageCommandInput,
  context?: CommandContext,
): Promise<DeleteMessageCommandOutput> {
  const result = await chatService
    .scoped(clients)
    .deleteMessage(input.userId, input.conversationId, input.messageId);

  if (context?.eventEmitter) {
    context.eventEmitter.emitMessageDeleted(
      {
        messageId: input.messageId,
        conversationId: input.conversationId,
        deletedBy: input.userId,
      },
      input.userId,
    );
  }

  return { success: result.success };
}
