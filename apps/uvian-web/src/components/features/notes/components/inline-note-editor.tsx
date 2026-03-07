'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@org/ui';
import { Field, FieldLabel, FieldError } from '@org/ui';
import { RichTextArea } from '~/components/shared/ui/rich-input';
import { notesMutations } from '~/lib/domains/notes/api';

const noteSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  body: z.string().optional(),
});

type NoteFormData = z.infer<typeof noteSchema>;

interface InlineNoteEditorProps {
  spaceId: string;
  onCancel?: () => void;
  onCreated?: (noteId: string) => void;
}

export function InlineNoteEditor({
  spaceId,
  onCancel,
  onCreated,
}: InlineNoteEditorProps) {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = React.useState(false);

  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: '',
      body: '',
    },
  });

  const createNote = useMutation({
    ...notesMutations.createNote(queryClient),
    onSuccess: (data) => {
      form.reset();
      onCreated?.(data.id);
    },
  });

  const handleSubmit = (data: NoteFormData) => {
    createNote.mutate({
      spaceId,
      title: data.title,
      body: data.body,
    });
  };

  if (!isExpanded) {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start text-muted-foreground"
        onClick={() => setIsExpanded(true)}
      >
        + Create new note
      </Button>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
      <Field>
        <FieldLabel>Note Title</FieldLabel>
        <input
          {...form.register('title')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Enter note title..."
        />
        {form.formState.errors.title && (
          <FieldError>{form.formState.errors.title.message}</FieldError>
        )}
      </Field>

      <Field>
        <FieldLabel>Note Content</FieldLabel>
        <RichTextArea
          value={form.watch('body') || ''}
          onChange={(value) => form.setValue('body', value)}
          placeholder="Write your note..."
          toolbar={true}
          className="min-h-[150px]"
        />
      </Field>

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setIsExpanded(false);
            form.reset();
            onCancel?.();
          }}
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={createNote.isPending}>
          {createNote.isPending ? 'Creating...' : 'Create Note'}
        </Button>
      </div>
    </form>
  );
}
