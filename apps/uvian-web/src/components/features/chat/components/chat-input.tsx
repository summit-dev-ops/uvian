'use client';

import React, { useRef, useEffect } from 'react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@org/ui';
import { SendHorizontal, Paperclip } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
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

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-transparent pt-12 pb-6 px-4">
      <div className="max-w-3xl mx-auto relative group">
        <InputGroup className="bg-background rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden focus:ring-primary/20 focus:border-primary/40 transition-all has-[>textarea]:h-auto flex-col">
          <InputGroupTextarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="py-3.5 px-4 max-h-[200px] text-sm"
            disabled={disabled}
          />

          <InputGroupAddon
            align="block-end"
            className="flex items-center justify-between px-3 pb-3 bg-muted/5"
          >
            <div className="flex items-center gap-1">
              <InputGroupButton
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-foreground"
              >
                <Paperclip className="h-5 w-5" />
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
        <div className="text-[10px] text-center mt-2 text-muted-foreground">
          AI generated content can be incorrect. Please verify important
          information.
        </div>
      </div>
    </div>
  );
}
