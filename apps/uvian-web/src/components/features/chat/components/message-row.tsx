'use client';

import Link from 'next/link';
import { useLongPress } from '@reactuses/core';
import { Avatar, AvatarFallback, AvatarImage, Badge, Button } from '@org/ui';
import { Copy, RefreshCcw, MoreHorizontal } from 'lucide-react';
import { ProfilePreview } from './profile-preview';
import {
  MentionChips,
  ImageGallery,
  LinkList,
} from '~/components/shared/ui/attachments';
import { MarkdownView } from '~/components/shared/ui/markdown';
import type { MessageUI } from '~/lib/domains/chat/types';
import { useModalContext, MODAL_IDS } from '~/components/shared/ui/modals';
import { useProcessedMessage } from '../hooks/use-processed-message';

interface MessageRowProps {
  message: MessageUI;
  onRetry?: () => void;
  showHeader: boolean;
}

export function MessageRow({ message, onRetry, showHeader }: MessageRowProps) {
  const profile = message.senderProfile;
  const modalContext = useModalContext();

  const isAI = message.role === 'assistant';
  const isSystem = message.role === 'system';

  const { processedContent, mentions, images, links, files } =
    useProcessedMessage({
      content: message.content,
      attachments: message.attachments,
    });

  const handleLongPress = () => {
    modalContext.openModal(MODAL_IDS.MESSAGE_SELECTION, {
      message,
      onRetry,
    });
  };

  const longPressEvent = useLongPress(handleLongPress);

  // 1. Create a helper to intercept the starting events
  const filterInteractiveElements = (
    e: React.MouseEvent | React.TouchEvent | React.PointerEvent,
    originalHandler?: any
  ) => {
    const target = e.target as HTMLElement;

    // If the user clicks on a link, image, or button, ignore the long press
    if (target.closest('a, img, button, [role="button"]')) {
      return;
    }

    // Otherwise, start the long press
    originalHandler?.(e);
  };

  const longPressProps = {
    ...longPressEvent,
    onMouseDown: (e: React.MouseEvent) =>
      filterInteractiveElements(e, longPressEvent.onMouseDown),
    onTouchStart: (e: React.TouchEvent) =>
      filterInteractiveElements(e, longPressEvent.onTouchStart),
    onPointerDown: (e: React.PointerEvent) =>
      filterInteractiveElements(e, (longPressEvent as any).onPointerDown),
  };

  const displayName = profile?.displayName || 'Unknown Profile';

  return (
    <div
      {...longPressProps}
      className={`flex flex-1 py-1 px-6 min-w-0 relative group  hover:bg-accent/50  rounded-sm border border-transparent hover:border-border  active:bg-accent/50 ${
        isSystem ? 'opacity-60' : ''
      }`}
    >
      <div className="flex flex-1 flex-col gap-1 min-w-0 relative">
        {showHeader && (
          <div className="flex flex-row items-center gap-2 flex-wrap">
            <ProfilePreview
              profileId={message?.senderProfile?.id}
              profile={profile}
              asChild
            >
              <Link
                href={`/users/${message?.senderProfile?.userId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors cursor-pointer flex flex-row items-center gap-2"
              >
                <Avatar>
                  <AvatarImage src={profile?.avatarUrl} />
                  <AvatarFallback>{displayName}</AvatarFallback>
                </Avatar>
                {displayName}
              </Link>
            </ProfilePreview>

            <MentionChips mentions={mentions} />

            <div className="flex-1 text-sm font-semibold flex items-center gap-2">
              {message.isStreaming && (
                <Badge
                  variant="secondary"
                  className="h-4 text-[10px] px-1 animate-pulse"
                >
                  Thinking...
                </Badge>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        )}

        <div className={`leading-relaxed ${!showHeader ? 'text-sm' : ''}`}>
          <MarkdownView content={processedContent} />
          <ImageGallery images={images} />
          <LinkList links={links} files={files} />
        </div>

        {!isSystem && !message.isStreaming && (
          <div className="absolute -top-6 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-0.5 bg-accent/50 rounded-md px-1 group-hover:shadow-md">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => navigator.clipboard.writeText(message.content)}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            {isAI && onRetry && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onRetry}
              >
                <RefreshCcw className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
