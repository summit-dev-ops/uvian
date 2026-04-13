import { ServiceClients } from '../../services/types';
import { createChatService } from '../../services/chat';
import type {
  InviteConversationMemberCommandInput,
  InviteConversationMemberCommandOutput,
  CommandContext,
} from './types';

const chatService = createChatService({});

export async function inviteConversationMember(
  clients: ServiceClients,
  input: InviteConversationMemberCommandInput,
  context?: CommandContext,
): Promise<InviteConversationMemberCommandOutput> {
  const member = await chatService
    .scoped(clients)
    .inviteMember(
      input.userId,
      input.conversationId,
      input.targetUserId,
      input.role || { name: 'member' },
    );

  if (context?.eventEmitter) {
    context.eventEmitter.emitConversationMemberJoined(
      {
        conversationId: input.conversationId,
        userId: input.targetUserId,
        invitedBy: input.userId,
      },
      input.userId,
    );
  }

  return { member };
}
