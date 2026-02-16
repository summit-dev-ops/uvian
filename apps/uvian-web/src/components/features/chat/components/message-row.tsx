'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage, Badge, Button } from '@org/ui';
import { Copy, RefreshCcw, MoreHorizontal } from 'lucide-react';
import { useMessageProfiles } from '~/components/features/chat/hooks/use-message-profiles';
import { ProfilePreview } from './profile-preview';
import type { MessageUI } from '~/lib/domains/chat/types';

interface MessageRowProps {
  message: MessageUI;
  onRetry?: () => void;
  onCopy?: () => void;
}

export function MessageRow({ message, onRetry, onCopy }: MessageRowProps) {
  const { profiles } = useMessageProfiles([message.senderId]);
  const profile = profiles[message.senderId];

  const isAI = message.role === 'assistant';
  const isSystem = message.role === 'system';

  const displayName = useMemo(() => {
    return profile?.displayName || 'Unknown Profile';
  }, [profile?.displayName]);

  return (
    <div className={`flex flex-1 py-2 px-6 ${isSystem ? 'opacity-60' : ''}`}>
      <div className="flex flex-1 flex-col gap-2">
        {/* Header with avatar and metadata */}
        <div className="flex flex-row items-center gap-2">
          <ProfilePreview profileId={message.senderId} profile={profile}>
            <Avatar>
              <AvatarImage src={profile?.avatarUrl} />
              <AvatarFallback>{displayName}</AvatarFallback>
            </Avatar>
          </ProfilePreview>

          <div className="flex-1 text-sm font-semibold flex items-center gap-2">
            <ProfilePreview profileId={message.senderId} profile={profile}>
              <Link
                href={`/profiles/${message.senderId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors cursor-pointer"
              >
                {displayName}
              </Link>
            </ProfilePreview>

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

        {/* Content - full width */}
        <div className="pl-10 pr-6">
          <div className="text-sm leading-relaxed whitespace-pre-wrap min-h-[1.5rem]">
            {message.content}
            {message.isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />
            )}
          </div>
        </div>

        {/* Actions - only for non-system, non-streaming messages */}
        {!isSystem && !message.isStreaming && (
          <div className="flex items-center justify-between transition-opacity pl-10 pr-6">
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
