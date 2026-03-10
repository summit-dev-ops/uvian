'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button, Avatar, AvatarFallback, AvatarImage } from '@org/ui';
import { Copy, RefreshCcw, Reply, Flag, Pencil, Trash2 } from 'lucide-react';
import type { MessageUI } from '~/lib/domains/chat/types';
import { AttachmentChips } from '~/components/shared/ui/attachments';
import { MarkdownView } from '~/components/shared/ui/markdown';
import { useProcessedMessage } from '~/components/features/chat/hooks/use-processed-message';

interface MessageActionsViewProps {
  message: MessageUI;
  isOwnMessage: boolean;
  isAI: boolean;
  onRetry?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function MessageActionsView({
  message,
  isOwnMessage,
  isAI,
  onRetry,
  onEdit,
  onDelete,
  onClose,
}: MessageActionsViewProps) {
  const { processedContent } = useProcessedMessage({
    content: message.content,
    attachments: message.attachments,
  });

  const profile = message.senderProfile;
  const displayName = profile?.displayName || 'Unknown';
  const avatarUrl = profile?.avatarUrl;
  const userId = profile?.userId;

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    onClose();
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
    onClose();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Sender Info Header */}
      <Link
        href={`/users/${userId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        onClick={onClose}
      >
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{displayName}</span>
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(message.createdAt)}
          </span>
        </div>
      </Link>

      {/* Message Content & Attachments */}
      <div className="bg-muted/50 rounded-lg p-3">
        <div className="space-y-2">
          <MarkdownView content={processedContent} />
          <AttachmentChips attachments={message.attachments || []} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1">
        <Button
          variant="secondary"
          className="w-full justify-start gap-3 h-11"
          onClick={handleCopy}
        >
          <Copy className="h-4 w-4" />
          Copy message
        </Button>

        {isAI && onRetry && (
          <Button
            variant="secondary"
            className="w-full justify-start gap-3 h-11"
            onClick={handleRetry}
          >
            <RefreshCcw className="h-4 w-4" />
            Regenerate response
          </Button>
        )}

        <Button
          variant="secondary"
          className="w-full justify-start gap-3 h-11"
          onClick={onClose}
        >
          <Reply className="h-4 w-4" />
          Reply
        </Button>

        {isOwnMessage && !isAI && (
          <>
            <Button
              variant="secondary"
              className="w-full justify-start gap-3 h-11"
              onClick={onEdit}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>

            <Button
              variant="secondary"
              className="w-full justify-start gap-3 h-11 text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </>
        )}

        <Button
          variant="secondary"
          className="w-full justify-start gap-3 h-11"
          onClick={onClose}
        >
          <Flag className="h-4 w-4" />
          Report
        </Button>
      </div>
    </div>
  );
}
