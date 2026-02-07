"use client"

import React from 'react';
import { Avatar, AvatarFallback, Badge, Button, cn } from "@org/ui";
import { Copy, RefreshCcw, MoreHorizontal } from "lucide-react";
import type { MessageUI } from '~/lib/domains/chat/types';

interface MessageRowProps {
  message: MessageUI;
  onRetry?: () => void;
  onCopy?: () => void;
}

export function MessageRow({ message, onRetry, onCopy }: MessageRowProps) {
  const isAI = message.role === 'assistant';
  const isSystem = message.role === 'system';

  return (
    <div
      className={cn(
        "flex flex-1 py-2 px-6"
      )}
    >
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-row items-center gap-2">
          <Avatar >
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-sm font-semibold flex items-center gap-2">
            {isAI ? 'Assistant' : 'You'}
            {message.isStreaming && (
              <Badge variant="secondary" className="h-4 text-[10px] px-1 animate-pulse">
                Thinking...
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Content */}
        <div className={cn(
          "text-sm leading-relaxed whitespace-pre-wrap min-h-[1.5rem]"
        )}>
          {message.content}
          {message.isStreaming && <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />}
        </div>

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
