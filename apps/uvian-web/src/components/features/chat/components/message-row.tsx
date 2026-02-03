"use client"

import React from 'react';
import { Avatar, Badge, Button, cn } from "@org/ui";
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
        "group w-full py-6 px-4 transition-colors",
        isAI ? "bg-muted/30" : "bg-background",
        isSystem && "bg-secondary/20 italic text-muted-foreground text-center py-2"
      )}
    >
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        {!isSystem && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className={cn(
                "h-8 w-8",
                isAI ? "bg-primary text-primary-foreground" : "bg-secondary"
              )}>
                <div className="text-[10px] font-bold">
                  {isAI ? 'AI' : 'ME'}
                </div>
              </Avatar>
              <div>
                <div className="text-sm font-semibold flex items-center gap-2">
                  {isAI ? 'Assistant' : 'You'}
                  {message.isStreaming && (
                    <Badge variant="secondary" className="h-4 text-[10px] px-1 animate-pulse">
                      Thinking...
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className={cn(
          "text-sm leading-relaxed whitespace-pre-wrap min-h-[1.5rem]",
          !isSystem && "pl-11"
        )}>
          {message.content}
          {message.isStreaming && <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />}
        </div>

        {/* Footer */}
        {!isSystem && !message.isStreaming && (
          <div className="pl-11 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="text-[10px] text-muted-foreground">
              {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7" 
                onClick={() => {
                  navigator.clipboard.writeText(message.content);
                  onCopy?.();
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              {isAI && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRetry}>
                  <RefreshCcw className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
