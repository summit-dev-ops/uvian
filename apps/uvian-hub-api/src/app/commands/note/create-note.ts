import { ServiceClients } from '../../services/types';
import { createNoteService } from '../../services/note';
import type {
  CreateNoteCommandInput,
  CreateNoteCommandOutput,
  CommandContext,
} from './types';

const noteService = createNoteService({});

export async function createNote(
  clients: ServiceClients,
  input: CreateNoteCommandInput,
  context?: CommandContext,
): Promise<CreateNoteCommandOutput> {
  const note = await noteService.scoped(clients).createNote(input.userId, {
    spaceId: input.spaceId,
    title: input.title,
    body: input.body,
    attachments: input.attachments,
  });

  if (context?.eventEmitter) {
    context.eventEmitter.emitNoteCreated(
      {
        noteId: note.id,
        title: note.title,
        content: note.body || '',
        createdBy: input.userId,
      },
      input.userId,
    );
  }

  return { note };
}
