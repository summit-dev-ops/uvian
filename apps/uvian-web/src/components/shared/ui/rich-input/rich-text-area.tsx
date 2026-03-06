'use client';

import React, { useEffect, useMemo } from 'react';
import { cn } from '@org/ui';
import {
  useEditor,
  EditorContent,
  EditorContext,
  Extension,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import { Plugin } from '@tiptap/pm/state';
import { Markdown } from '@tiptap/markdown';
import { createSuggestionConfig } from './suggestion';
import { RichTextToolbar } from './rich-text-toolbar';
import { useQueryClient } from '@tanstack/react-query';
import type { SearchResultItemData } from '../search/types';

interface RichTextAreaProps
  extends Omit<React.ComponentProps<'div'>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  mentionSearch?: (query: string) => Promise<SearchResultItemData[]>;
  toolbar?: boolean;
}

const PasteMarkdown = Extension.create({
  name: 'pasteMarkdown',

  addProseMirrorPlugins() {
    const { editor } = this;
    return [
      new Plugin({
        props: {
          handlePaste(view, event, slice) {
            const text = event.clipboardData?.getData('text/plain');

            if (!text) {
              return false;
            }

            if (editor.markdown && looksLikeMarkdown(text)) {
              const json = editor.markdown.parse(text);
              editor.commands.insertContent(json, { contentType: 'json' });
              return true;
            }

            return false;
          },
        },
      }),
    ];
  },
});

function looksLikeMarkdown(text: string): boolean {
  return (
    /^#{1,6}\s/.test(text) ||
    /\*\*[^*]+\*\*/.test(text) ||
    /\[.+\]\(.+\)/.test(text) ||
    /^[-*+]\s/.test(text)
  );
}

export function RichTextArea({
  className,
  value,
  onChange,
  onKeyDown,
  placeholder,
  disabled,
  mentionSearch,
  toolbar,
  ...props
}: RichTextAreaProps) {
  const queryClient = useQueryClient();

  const suggestionConfig = useMemo(
    () =>
      createSuggestionConfig(queryClient, {
        search: mentionSearch ?? (async () => []),
      }),
    [queryClient, mentionSearch]
  );

  const editor = useEditor({
    editable: !disabled,
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Markdown,
      PasteMarkdown,
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        suggestion: suggestionConfig,
      }),
    ],
    content: value,
    contentType: 'markdown',
    editorProps: {
      attributes: {
        class: cn(
          'prose prose dark:prose-invert max-w-none focus:outline-none min-h-[40px] w-full',
          className
        ),
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          const isSuggestionOpen = document.querySelector('.tippy-box');
          if (isSuggestionOpen) return false;
          return false;
        }
        return false;
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getMarkdown());
    },
    onCreate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getMarkdown());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const currentMarkdown = editor.getMarkdown();
    if (value !== currentMarkdown) {
      if (value === '') {
        editor.commands.clearContent();
      } else {
        editor.commands.setContent(value, { contentType: 'markdown' });
      }
    }
  }, [value, editor]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  const editorContextValue = useMemo(() => ({ editor }), [editor]);

  if (!editor) {
    return null;
  }

  return (
    <EditorContext.Provider value={editorContextValue}>
      <div className="flex flex-col w-full">
        {toolbar && <RichTextToolbar />}
        <EditorContent
          editor={editor}
          data-slot="input-group-control"
          className="flex-1 w-full"
          onKeyDown={onKeyDown}
          {...props}
        />
      </div>
    </EditorContext.Provider>
  );
}
