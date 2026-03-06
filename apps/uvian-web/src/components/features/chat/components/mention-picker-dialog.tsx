'use client';

import React, { useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@org/ui';
import { Button } from '@org/ui';
import { ChatUserSearchProvider } from '../providers/chat-user-search-provider';
import { SearchInterface } from '~/components/shared/ui/search/components';
import { MentionAttachment } from '~/lib/domains/posts/types';
import { SearchResultItemData } from '~/components/shared/ui/search/types';
import { SelectionProvider } from '~/components/shared/ui/search/contexts/search-selection-context';
import { SelectionDisplay } from '~/components/shared/ui/search/components/selection-display';

interface MentionPickerDialogProps {
  conversationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (mentions: MentionAttachment[]) => void;
  onCancel?: () => void;
}

export function MentionPickerDialog({
  conversationId,
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: MentionPickerDialogProps) {
  const [selectedItems, setSelectedItems] = React.useState<
    SearchResultItemData[]
  >([]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedItems([]);
    }
    onOpenChange(isOpen);
  };

  const handleConfirm = useCallback(() => {
    const mentions: MentionAttachment[] = selectedItems.map((item) => ({
      key: item.key,
      userId: item.key,
      type: 'mention',
      label: item.content.displayName,
    }));
    onConfirm(mentions);
    setSelectedItems([]);
    onOpenChange(false);
  }, [selectedItems, onConfirm, onOpenChange]);

  const handleCancel = useCallback(() => {
    setSelectedItems([]);
    onCancel?.();
    onOpenChange(false);
  }, [onCancel, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tag 'em</DialogTitle>
        </DialogHeader>
        <ChatUserSearchProvider conversationId={conversationId}>
          <SelectionProvider
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
            keyExtractor={(item: SearchResultItemData) => item.key}
            mode="multiple-choice"
          >
            <SearchInterface>
              <SelectionDisplay />
            </SearchInterface>
          </SelectionProvider>
        </ChatUserSearchProvider>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleConfirm}>
            Add Mentions
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
