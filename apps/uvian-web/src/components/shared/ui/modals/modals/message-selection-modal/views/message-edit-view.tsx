'use client';

import * as React from 'react';
import { Button } from '@org/ui';
import { ChatInput } from '~/components/features/chat/components/chat-input';
import type { MessageUI, Attachment } from '~/lib/domains/chat/types';

interface MessageEditViewProps {
  message: MessageUI;
  editContent: string;
  onEditContentChange: (content: string) => void;
  onSave: (content: string, attachments?: Attachment[]) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function MessageEditView({
  message,
  editContent,
  onEditContentChange,
  onSave,
  onCancel,
  isSaving = false,
}: MessageEditViewProps) {
  const [localContent, setLocalContent] = React.useState(message.content);
  const [localAttachments, setLocalAttachments] = React.useState<Attachment[]>(
    message.attachments || []
  );
  const inputRef = React.useRef<{ focus: () => void }>(null);

  React.useEffect(() => {
    setLocalContent(message.content);
    setLocalAttachments(message.attachments || []);
  }, [message.content, message.attachments]);

  React.useEffect(() => {
    // Focus input when edit view mounts
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    onSave(localContent, localAttachments);
  };

  const hasChanges =
    localContent.trim() !== message.content.trim() ||
    JSON.stringify(localAttachments) !==
      JSON.stringify(message.attachments || []);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm">Edit message</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
      </div>

      {/* ChatInput for editing */}
      <ChatInput
        ref={inputRef}
        value={localContent}
        onChange={setLocalContent}
        context={{ conversationId: message.conversationId }}
        onSend={handleSend}
        attachments={localAttachments}
        onAttachmentsChange={setLocalAttachments}
        disabled={isSaving}
      />

      {/* Helper text */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Click Send to save</span>
        {!hasChanges && <span>No changes</span>}
      </div>
    </div>
  );
}
