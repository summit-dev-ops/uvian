import { ServiceClients } from '../../services/types';
import { createChatService } from '../../services/chat';
import type {
  UpdateMessageCommandInput,
  UpdateMessageCommandOutput,
  CommandContext,
} from './types';

const chatService = createChatService({});

export async function updateMessage(
  clients: ServiceClients,
  input: UpdateMessageCommandInput,
  context?: CommandContext,
): Promise<UpdateMessageCommandOutput> {
  const message = await chatService
    .scoped(clients)
    .updateMessage(
      input.userId,
      input.conversationId,
      input.messageId,
      input.content,
      input.attachments,
    );

  if (context?.eventEmitter) {
    context.eventEmitter.emitMessageUpdated(
      {
        messageId: input.messageId,
        conversationId: input.conversationId,
        content: input.content,
        updatedBy: input.userId,
      },
      input.userId,
    );
  }

  return { message };
}
