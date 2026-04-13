import { ServiceClients } from '../../services/types';
import { createPostService } from '../../services/post';
import type {
  DeletePostCommandInput,
  DeletePostCommandOutput,
  CommandContext,
} from './types';

const postService = createPostService({});

export async function deletePost(
  clients: ServiceClients,
  input: DeletePostCommandInput,
  context?: CommandContext,
): Promise<DeletePostCommandOutput> {
  const result = await postService
    .scoped(clients)
    .deletePost(input.postId, input.userId);

  if (context?.eventEmitter) {
    context.eventEmitter.emitPostDeleted(
      { postId: input.postId, deletedBy: input.userId },
      input.userId,
    );
  }

  return { success: result.success };
}
