import { ServiceClients } from '../../services/types';
import { createChatService } from '../../services/chat';
import type {
  CreateConversationCommandInput,
  CreateConversationCommandOutput,
  CommandContext,
} from './types';

const chatService = createChatService({});

export async function createConversation(
  clients: ServiceClients,
  input: CreateConversationCommandInput,
  context?: CommandContext,
): Promise<CreateConversationCommandOutput> {
  const conversation = await chatService
    .scoped(clients)
    .createConversation(input.userId, {
      title: input.title,
      spaceId: input.spaceId,
    });

  if (context?.eventEmitter) {
    context.eventEmitter.emitConversationCreated(
      {
        conversationId: conversation.id,
        spaceId: conversation.spaceId,
        createdBy: input.userId,
        memberIds: [input.userId],
      },
      input.userId,
    );
  }

  return { conversation };
}
