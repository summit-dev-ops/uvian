import { ServiceClients } from '../../services/types';
import { createChatService } from '../../services/chat';
import type {
  CreateMessageCommandInput,
  CreateMessageCommandOutput,
  CommandContext,
} from './types';

const chatService = createChatService({});

export async function createMessage(
  clients: ServiceClients,
  input: CreateMessageCommandInput,
  context?: CommandContext,
): Promise<CreateMessageCommandOutput> {
  const message = await chatService
    .scoped(clients)
    .createMessage(input.userId, input.conversationId, {
      id: input.id,
      content: input.content,
      role: input.role,
      attachments: input.attachments,
    });

  if (context?.eventEmitter) {
    context.eventEmitter.emitMessageCreated(
      {
        messageId: message.id,
        conversationId: input.conversationId,
        content: message.content,
        senderId: input.userId,
      },
      input.userId,
    );
  }

  if (context?.io) {
    context.io.to(input.conversationId).emit('new_message', {
      conversationId: input.conversationId,
      message,
    });
  }

  return { message };
}
