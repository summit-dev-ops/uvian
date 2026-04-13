import { ServiceClients } from '../../services/types';
import { createNoteService } from '../../services/note';
import type {
  UpdateNoteCommandInput,
  UpdateNoteCommandOutput,
  CommandContext,
} from './types';

const noteService = createNoteService({});

export async function updateNote(
  clients: ServiceClients,
  input: UpdateNoteCommandInput,
  context?: CommandContext,
): Promise<UpdateNoteCommandOutput> {
  const note = await noteService
    .scoped(clients)
    .updateNote(input.userId, input.noteId, {
      title: input.title,
      body: input.body,
      attachments: input.attachments,
    });

  if (context?.eventEmitter) {
    context.eventEmitter.emitNoteUpdated(
      {
        noteId: input.noteId,
        updatedBy: input.userId,
        title: note.title,
        content: input.body,
      },
      input.userId,
    );
  }

  return { note };
}
