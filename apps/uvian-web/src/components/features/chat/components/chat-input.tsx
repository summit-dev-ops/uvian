'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Button, InputGroup, InputGroupAddon, InputGroupButton } from '@org/ui';
import {
  SendHorizontal,
  Paperclip,
  AtSign,
  Link as LinkIcon,
  X,
} from 'lucide-react';
import { RichTextArea } from './rich-text-area';
import { AssetPickerDialog } from '~/components/features/assets';
import { MentionPicker } from './mention-picker';
import { LinkInput } from './link-input';
import type { AssetUI } from '~/lib/domains/assets';
import type { Attachment } from '~/lib/domains/chat/types';

interface ChatInputProps {
  value: string;
  context: { conversationId: string };
  onChange: (value: string) => void;
  onSend: () => void;
  attachments?: Attachment[];
  onAttachmentsChange?: (attachments: Attachment[]) => void;
  disabled?: boolean;
}

export function ChatInput({
  value,
  context,
  onChange,
  onSend,
  attachments = [],
  onAttachmentsChange,
  disabled,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleAssetSelect = (asset: AssetUI) => {
    const fileAttachment: Attachment = {
      type: 'file',
      url: asset.url,
      filename: asset.filename || undefined,
      mimeType: asset.mimeType || undefined,
      size: asset.fileSizeBytes || undefined,
    };
    onAttachmentsChange?.([...attachments, fileAttachment]);
    setShowAssetPicker(false);
  };

  const handleMentionSelect = (userId: string, label: string) => {
    const mentionAttachment: Attachment = {
      type: 'mention',
      userId,
      label,
    };
    onAttachmentsChange?.([...attachments, mentionAttachment]);
  };

  const handleLinkAdd = (url: string) => {
    const linkAttachment: Attachment = {
      type: 'link',
      url,
    };
    onAttachmentsChange?.([...attachments, linkAttachment]);
  };

  const removeAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    onAttachmentsChange?.(newAttachments);
  };

  return (
    <>
      <InputGroup className="bg-background rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden focus:ring-primary/20 focus:border-primary/40 transition-all has-[>textarea]:h-auto flex-col">
        <InputGroupAddon
          align="block-start"
          className="flex items-center justify-between px-3 bg-muted/5"
        >
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center justify-start">
              {attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
                >
                  {attachment.type === 'mention' && (
                    <AtSign className="h-3 w-3" />
                  )}
                  {attachment.type === 'file' && (
                    <Paperclip className="h-3 w-3" />
                  )}
                  {attachment.type === 'link' && (
                    <LinkIcon className="h-3 w-3" />
                  )}
                  <span className="max-w-[150px] truncate">
                    {attachment.type === 'mention'
                      ? attachment.label
                      : attachment.type === 'file'
                      ? attachment.filename
                      : attachment.url}
                  </span>
                  <Button
                    variant={'ghost'}
                    size={'icon'}
                    className="h-4 w-4"
                    onClick={() => removeAttachment(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </InputGroupAddon>

        <RichTextArea
          value={value}
          onChange={(newValue) => onChange(newValue)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="py-3.5 px-4 max-h-[200px] overflow-y-auto"
          disabled={disabled}
          context={context}
        />

        <InputGroupAddon
          align="block-end"
          className="flex items-center justify-between px-3 pb-3 bg-muted/5"
        >
          <div className="flex items-center gap-1">
            <InputGroupButton
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setShowMentionPicker(true)}
              type="button"
            >
              <AtSign className="h-5 w-5" />
            </InputGroupButton>
            <InputGroupButton
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setShowAssetPicker(true)}
              type="button"
            >
              <Paperclip className="h-5 w-5" />
            </InputGroupButton>
            <InputGroupButton
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setShowLinkInput(true)}
              type="button"
            >
              <LinkIcon className="h-5 w-5" />
            </InputGroupButton>
          </div>

          <InputGroupButton
            size="icon-sm"
            variant="default"
            onClick={onSend}
            disabled={!value.trim() || disabled}
            className="rounded-xl shrink-0"
          >
            <SendHorizontal className="h-4 w-4" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>

      <AssetPickerDialog
        open={showAssetPicker}
        onOpenChange={setShowAssetPicker}
        onSelect={handleAssetSelect}
      />
      <MentionPicker
        conversationId={context.conversationId}
        open={showMentionPicker}
        onOpenChange={setShowMentionPicker}
        onSelect={handleMentionSelect}
      />
      <LinkInput
        open={showLinkInput}
        onOpenChange={setShowLinkInput}
        onAdd={handleLinkAdd}
      />
    </>
  );
}
