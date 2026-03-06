'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Clock, MoreVertical, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@org/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@org/ui';
import { Button } from '@org/ui';
import { notesQueries } from '~/lib/domains/notes/api';
import { usePageActionContext } from '~/components/shared/ui/pages/page-actions/page-action-context';
import {
  InterfaceEmpty,
  InterfaceLoading,
} from '~/components/shared/ui/interfaces';

interface NotesListProps {
  spaceId: string;
}

export function NotesList({ spaceId }: NotesListProps) {
  const { executeAction } = usePageActionContext();

  const { data: notesResponse, isLoading } = useQuery(
    notesQueries.spaceNotes(spaceId)
  );

  const handleDelete = React.useCallback(
    async (noteId: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        await executeAction('delete-note', { noteId, spaceId });
      } catch (error) {
        console.error('Failed to delete note:', error);
      }
    },
    [executeAction, spaceId]
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').slice(0, 150);
  };

  if (isLoading) {
    return <InterfaceLoading message="Loading notes..." />;
  }

  const notes = notesResponse?.items || [];

  if (notes.length === 0) {
    return (
      <InterfaceEmpty
        title="No notes yet"
        message="Create your first note to get started!"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {notes.map((note) => (
        <Link
          key={note.id}
          href={`/spaces/${spaceId}/notes/${note.id}`}
          className="block"
        >
          <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg line-clamp-1">
                  {note.title}
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                    onClick={(e) => e.preventDefault()}
                  >
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => handleDelete(note.id, e)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {note.body ? stripHtml(note.body) : 'No content'}
              </p>
              <div className="flex items-center mt-3 text-xs text-muted-foreground">
                <Clock className="mr-1 h-3 w-3" />
                {formatDate(note.updatedAt)}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
