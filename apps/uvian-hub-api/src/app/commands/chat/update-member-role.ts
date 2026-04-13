import { ServiceClients } from '../../services/types';
import { createChatService } from '../../services/chat';
import type {
  UpdateConversationMemberRoleCommandInput,
  UpdateConversationMemberRoleCommandOutput,
} from './types';

const chatService = createChatService({});

export async function updateConversationMemberRole(
  clients: ServiceClients,
  input: UpdateConversationMemberRoleCommandInput,
): Promise<UpdateConversationMemberRoleCommandOutput> {
  const member = await chatService
    .scoped(clients)
    .updateMemberRole(
      input.userId,
      input.conversationId,
      input.targetUserId,
      input.role,
    );

  return { member };
}
