import { ServiceClients } from '../../services/types';
import { createPostService } from '../../services/post';
import { createNoteService } from '../../services/note';
import type {
  CreatePostCommandInput,
  CreatePostCommandOutput,
  CommandContext,
} from './types';

const postService = createPostService({});
const noteService = createNoteService({});

export async function createPost(
  clients: ServiceClients,
  input: CreatePostCommandInput,
  context?: CommandContext,
): Promise<CreatePostCommandOutput> {
  const post = await postService
    .scoped(clients)
    .createPost({ spaceId: input.spaceId, userId: input.userId });

  const contents = input.contents || [];
  for (let i = 0; i < contents.length; i++) {
    const item = contents[i];

    if (item.type === 'note') {
      let noteId = item.noteId;

      if (item.note?.title) {
        const createdNote = await noteService
          .scoped(clients)
          .createNote(input.userId, {
            id: item.noteId,
            spaceId: input.spaceId,
            title: item.note.title,
            body: item.note.body,
            attachments: item.note.attachments,
          });
        noteId = createdNote.id;
      }

      await clients.adminClient
        .schema('core_hub')
        .from('post_contents')
        .insert({
          post_id: post.id,
          content_type: 'note',
          note_id: noteId,
          position: i,
        });
    } else if (item.type === 'asset') {
      await clients.adminClient
        .schema('core_hub')
        .from('post_contents')
        .insert({
          post_id: post.id,
          content_type: 'asset',
          asset_id: item.assetId,
          position: i,
        });
    } else if (item.type === 'external') {
      await clients.adminClient
        .schema('core_hub')
        .from('post_contents')
        .insert({
          post_id: post.id,
          content_type: 'external',
          url: item.url,
          position: i,
        });
    }
  }

  const fullPost = await postService.scoped(clients).getPost(post.id);

  if (context?.eventEmitter) {
    context.eventEmitter.emitPostCreated(
      {
        postId: post.id,
        content: JSON.stringify(contents),
        authorId: input.userId,
        spaceId: input.spaceId,
      },
      input.userId,
    );
  }

  return { post: fullPost };
}
