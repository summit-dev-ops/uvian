'use client';

import * as React from 'react';
import { MessageSquare } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@org/ui';
import { ConversationForm } from '../features/chat/components/forms/conversation-form';

export interface CreateConversationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (title: string) => void;
  isLoading?: boolean;
}

export function CreateConversationModal({
  open,
  onOpenChange,
  onCreate,
  isLoading = false,
}: CreateConversationModalProps) {
  const handleSubmit = async (data: { title: string }) => {
    try {
      await onCreate(data.title);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Create New Conversation
          </DialogTitle>
          <DialogDescription>
            Enter a title for your new conversation.
          </DialogDescription>
        </DialogHeader>

        <ConversationForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          showCancel={false} // Modal provides its own cancel
        />
      </DialogContent>
    </Dialog>
  );
}
