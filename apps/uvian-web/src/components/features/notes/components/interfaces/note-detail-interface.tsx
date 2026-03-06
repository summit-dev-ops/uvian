'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Clock } from 'lucide-react';
import { Button } from '@org/ui';
import { RichTextArea } from '~/components/shared/ui/rich-input';
import { notesQueries, notesMutations } from '~/lib/domains/notes/api';
import {
  InterfaceLayout,
  InterfaceHeader,
  InterfaceContent,
  InterfaceContainer,
  InterfaceLoading,
  InterfaceError,
} from '~/components/shared/ui/interfaces';

const noteSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  body: z.string().optional(),
});

type NoteFormData = z.infer<typeof noteSchema>;

interface NoteDetailInterfaceProps {
  spaceId: string;
  noteId: string;
}

export function NoteDetailInterface({
  spaceId,
  noteId,
}: NoteDetailInterfaceProps) {
  const queryClient = useQueryClient();

  const {
    data: note,
    isLoading,
    error,
  } = useQuery(notesQueries.note(spaceId, noteId));

  const updateNote = useMutation(notesMutations.updateNote(queryClient));

  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: '',
      body: '',
    },
  });

  React.useEffect(() => {
    if (note) {
      form.reset({
        title: note.title,
        body: note.body || '',
      });
    }
  }, [note, form]);

  const handleSave = React.useCallback(
    (data: NoteFormData) => {
      updateNote.mutate({
        noteId,
        spaceId,
        title: data.title,
        body: data.body,
      });
    },
    [noteId, spaceId, updateNote]
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <InterfaceLayout>
        <InterfaceContainer>
          <InterfaceLoading message="Loading note..." />
        </InterfaceContainer>
      </InterfaceLayout>
    );
  }

  if (error || !note) {
    return (
      <InterfaceLayout>
        <InterfaceContainer>
          <InterfaceError
            title="Note not found"
            message={error?.message || 'Unable to load note'}
          />
        </InterfaceContainer>
      </InterfaceLayout>
    );
  }

  return (
    <InterfaceLayout>
      <InterfaceContainer size="spacious">
        <InterfaceHeader className="mb-4">
          <div className="flex items-start justify-between w-full">
            <div className="flex-1 mr-4">
              <input
                {...form.register('title')}
                className="text-2xl font-bold bg-transparent border-none outline-none w-full placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 px-0"
                placeholder="Note title..."
              />
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Clock className="mr-1 h-4 w-4" />
                Last updated: {formatDate(note.updatedAt)}
              </div>
            </div>
            <Button
              type="submit"
              disabled={updateNote.isPending}
              onClick={form.handleSubmit(handleSave)}
            >
              <Save className="mr-2 h-4 w-4" />
              {updateNote.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </InterfaceHeader>
        <InterfaceContent>
          <RichTextArea
            value={form.watch('body') || ''}
            onChange={(value) => form.setValue('body', value)}
            placeholder="Start writing..."
            toolbar={true}
            className="min-h-[500px]"
          />
        </InterfaceContent>
      </InterfaceContainer>
    </InterfaceLayout>
  );
}
