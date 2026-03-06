'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage, Badge, Button } from '@org/ui';
import { Copy, RefreshCcw, MoreHorizontal } from 'lucide-react';
import { ProfilePreview } from './profile-preview';
import {
  MentionChips,
  ImageGallery,
  LinkList,
} from '~/components/shared/ui/attachments';
import { MarkdownView } from '~/components/shared/ui/markdown';
import {
  isImageAttachment,
  isMentionAttachment,
  isLinkAttachment,
} from '~/lib/domains/shared/attachments/utils';
import type {
  MessageUI,
  Attachment,
  FileAttachment,
  MentionAttachment,
  LinkAttachment,
} from '~/lib/domains/chat/types';

interface MessageRowProps {
  message: MessageUI;
  onRetry?: () => void;
  onCopy?: () => void;
}

const MENTION_REGEX = /\[@ id="([^"]+)" label="([^"]+)"\]/g;

function isImage(attachment: Attachment): attachment is FileAttachment {
  return isImageAttachment(attachment);
}

function isMention(attachment: Attachment): attachment is MentionAttachment {
  return isMentionAttachment(attachment);
}

function isLink(attachment: Attachment): attachment is LinkAttachment {
  return isLinkAttachment(attachment);
}

export function MessageRow({ message, onRetry, onCopy }: MessageRowProps) {
  const profile = message.senderProfile;

  const isAI = message.role === 'assistant';
  const isSystem = message.role === 'system';

  const displayName = useMemo(() => {
    return profile?.displayName || 'Unknown Profile';
  }, [profile?.displayName]);

  const processedContent = useMemo(() => {
    return message.content.replace(MENTION_REGEX, (_, id, label) => {
      return `[${label}](/profiles/${id})`;
    });
  }, [message.content]);

  const attachments = message.attachments || [];

  const mentions = useMemo(() => attachments.filter(isMention), [attachments]);

  const images = useMemo(() => attachments.filter(isImage), [attachments]);

  const links = useMemo(() => attachments.filter(isLink), [attachments]);

  const files = useMemo(
    () => attachments.filter((a) => a.type === 'file' && !isImage(a)),
    [attachments]
  );

  return (
    <div
      className={`flex flex-1 py-2 px-6 min-w-0 relative ${
        isSystem ? 'opacity-60' : ''
      }`}
    >
      <div className="flex flex-1 flex-col gap-2 min-w-0 relative">
        <div className="flex flex-row items-center gap-2 flex-wrap">
          <ProfilePreview
            profileId={message?.senderProfile?.id}
            profile={profile}
            asChild
          >
            <Link
              href={`/profiles/${message?.senderProfile?.id}`}
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

        <div className="leading-relaxed">
          <MarkdownView content={processedContent} />
          <ImageGallery images={images} />
          <LinkList links={links} files={files} />
        </div>

        {/* Actions - only for non-system, non-streaming messages */}
        {!isSystem && !message.isStreaming && (
          <div className="flex items-center justify-between transition-opacity">
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(message.content);
                  onCopy?.();
                }}
              >
                <Copy />
              </Button>
              {isAI && (
                <Button variant="ghost" size="icon" onClick={onRetry}>
                  <RefreshCcw />
                </Button>
              )}
              <Button variant="ghost" size="icon">
                <MoreHorizontal />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
