export const notesKeys = {
  all: ['notes'] as const,
  space: (spaceId: string) => [...notesKeys.all, 'space', spaceId] as const,
  detail: (noteId: string) => [...notesKeys.all, 'detail', noteId] as const,
};
