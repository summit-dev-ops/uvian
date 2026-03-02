'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@org/ui';
import { AtSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@org/ui';
import { Button } from '@org/ui';
import { Input } from '@org/ui';
import {
  ChatUserSearchProvider,
  useChatUserSearch,
} from '../providers/chat-user-search-provider';

interface MentionPickerProps {
  conversationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (userId: string, label: string) => void;
}

function MentionPickerContent({
  onSelect,
}: {
  onSelect: (userId: string, label: string) => void;
}) {
  const {
    query,
    setQuery,
    results,
    isLoading,
    selected,
    toggleSelected,
    clearSelection,
  } = useChatUserSearch();

  const handleSubmit = () => {
    selected.forEach((profile) => {
      onSelect(profile.id, profile.displayName);
    });
    clearSelection();
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search users..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />

      <div className="max-h-[300px] overflow-y-auto space-y-2">
        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading...</p>
        )}
        {!isLoading && results.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {query ? 'No users found' : 'Start typing to search'}
          </p>
        )}
        {results.map((profile) => {
          const isSelected = selected.some((s) => s.id === profile.id);
          return (
            <button
              key={profile.id}
              type="button"
              onClick={() => toggleSelected(profile)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${
                isSelected ? 'bg-primary/10' : 'hover:bg-muted'
              }`}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile.avatarUrl} />
                <AvatarFallback>{profile.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{profile.displayName}</span>
              {isSelected && <AtSign className="h-4 w-4 ml-auto" />}
            </button>
          );
        })}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={clearSelection}>
          Clear
        </Button>
        <Button onClick={handleSubmit} disabled={selected.length === 0}>
          Add
        </Button>
      </div>
    </div>
  );
}

export function MentionPicker({
  conversationId,
  open,
  onOpenChange,
  onSelect,
}: MentionPickerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Mention</DialogTitle>
        </DialogHeader>
        <ChatUserSearchProvider conversationId={conversationId}>
          <MentionPickerContent onSelect={onSelect} />
        </ChatUserSearchProvider>
      </DialogContent>
    </Dialog>
  );
}
