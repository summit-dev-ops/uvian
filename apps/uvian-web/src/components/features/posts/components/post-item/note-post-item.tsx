'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@org/ui';
import { FileText } from 'lucide-react';
import { notesQueries } from '~/lib/domains/notes/api';
import { MarkdownView } from '~/components/shared/ui/markdown/markdown-view';

interface NotePostItemProps {
  spaceId: string;
  noteId: string;
  maxLines?: number;
}

export function NotePostItem({ spaceId, noteId, maxLines }: NotePostItemProps) {
  const { data: note, isLoading } = useQuery(
    notesQueries.note(spaceId, noteId)
  );

  if (isLoading) {
    return <NotePostItemSkeleton />;
  }

  if (!note) {
    return (
      <div className="flex items-center gap-2 p-3 bg-secondary rounded-md">
        <FileText className="h-4 w-4" />
        <span className="text-sm text-muted-foreground">Note not found</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-medium">{note.title}</h3>
      {note.body && (
        <div className={maxLines ? `line-clamp-${maxLines}` : ''}>
          <MarkdownView content={note.body} />
        </div>
      )}
    </div>
  );
}

export function NotePostItemSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}
