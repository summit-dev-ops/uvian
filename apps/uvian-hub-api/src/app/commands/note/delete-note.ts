import { ServiceClients } from '../../services/types';
import { createNoteService } from '../../services/note';
import type {
  DeleteNoteCommandInput,
  DeleteNoteCommandOutput,
  CommandContext,
} from './types';

const noteService = createNoteService({});

export async function deleteNote(
  clients: ServiceClients,
  input: DeleteNoteCommandInput,
  context?: CommandContext,
): Promise<DeleteNoteCommandOutput> {
  const result = await noteService
    .scoped(clients)
    .deleteNote(input.userId, input.noteId);

  if (context?.eventEmitter) {
    context.eventEmitter.emitNoteDeleted(
      { noteId: input.noteId, deletedBy: input.userId },
      input.userId,
    );
  }

  return { success: result.success };
}
