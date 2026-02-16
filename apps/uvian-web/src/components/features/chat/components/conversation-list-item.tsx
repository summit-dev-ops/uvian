'use client';

import Link from 'next/link';
import {
  Item,
  ItemSeparator,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemHeader,
  ItemMedia,
} from '@org/ui';
import { MessageSquare } from 'lucide-react';

import type { PreviewData } from '~/lib/domains/chat/types';

interface ConversationListItemProps {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: 'synced' | 'pending' | 'error';
  lastMessage?: PreviewData['lastMessage'];
  isLoadingPreview?: boolean;
}

export function ConversationListItem({
  id,
  title,
  createdAt,
  updatedAt,
  syncStatus,
  lastMessage,
  isLoadingPreview,
}: ConversationListItemProps) {
  return (
    <Link key={id} href={`/chats/${id}`} className="block">
      <Item size="sm">
        <ItemMedia variant="icon">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </ItemMedia>
        <ItemContent>
          <ItemHeader>
            <ItemTitle>{title || 'Untitled Conversation'}</ItemTitle>
            <ItemActions>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(createdAt).toLocaleDateString()}
              </span>
            </ItemActions>
          </ItemHeader>
          {isLoadingPreview ? (
            <div className="h-3 w-32 bg-muted animate-pulse rounded" />
          ) : (
            <ItemDescription>
              {lastMessage?.content || 'No messages yet'}
            </ItemDescription>
          )}
        </ItemContent>
      </Item>
      <ItemSeparator />
    </Link>
  );
}
