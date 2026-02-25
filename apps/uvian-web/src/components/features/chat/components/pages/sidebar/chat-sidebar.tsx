'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Button,
} from '@org/ui';
import { chatQueries } from '~/lib/domains/chat/api/queries';
import { useUserSessionStore } from '~/components/features/user/hooks/use-user-store';
import type { ConversationUI } from '~/lib/domains/chat/types';

interface ChatSidebarProps {
  currentConversationId: string;
}

export function ChatSidebar({ currentConversationId }: ChatSidebarProps) {
  const pathname = usePathname();
  const { activeProfileId } = useUserSessionStore();

  const { data: conversations = [] } = useQuery(
    chatQueries.conversations(activeProfileId)
  );

  const currentConversation = (conversations as ConversationUI[]).find(
    (c) => c.id === currentConversationId
  );

  const otherConversations = (conversations as ConversationUI[]).filter(
    (c) => c.id !== currentConversationId
  );

  const groupedConversations = React.useMemo(() => {
    const spaceConversations: Record<string, ConversationUI[]> = {};
    const directMessages: ConversationUI[] = [];

    otherConversations.forEach((conv) => {
      if (conv.resourceScopeId) {
        if (!spaceConversations[conv.resourceScopeId]) {
          spaceConversations[conv.resourceScopeId] = [];
        }
        spaceConversations[conv.resourceScopeId].push(conv);
      } else {
        directMessages.push(conv);
      }
    });

    return { spaceConversations, directMessages };
  }, [otherConversations]);

  return (
    <>
      <SidebarHeader className="pt-4">
        <div className="px-2">
          <h2 className="text-sm font-semibold truncate">
            {currentConversation?.title || 'Chat'}
          </h2>
          <p className="text-xs text-muted-foreground">
            {otherConversations.length} other conversations
          </p>
        </div>
      </SidebarHeader>

      <SidebarHeader className="pb-0">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          asChild
        >
          <Link href="/chats">
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Link>
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="mt-2">
          <SidebarGroupContent>
            <SidebarMenu>
              {groupedConversations.directMessages.length > 0 && (
                <>
                  <div className="px-4 py-1 text-xs font-medium text-muted-foreground">
                    Direct Messages
                  </div>
                  {groupedConversations.directMessages.map((conv) => (
                    <SidebarMenuItem key={conv.id}>
                      <SidebarMenuButton asChild>
                        <Link
                          href={`/chats/${conv.id}`}
                          className={
                            pathname === `/chats/${conv.id}` ? 'bg-accent' : ''
                          }
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span className="truncate">{conv.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </>
              )}

              {Object.keys(groupedConversations.spaceConversations).length >
                0 && (
                <>
                  <div className="px-4 py-1 text-xs font-medium text-muted-foreground mt-2">
                    In Spaces
                  </div>
                  {Object.entries(groupedConversations.spaceConversations).map(
                    ([spaceId, convs]) =>
                      convs.map((conv) => (
                        <SidebarMenuItem key={conv.id}>
                          <SidebarMenuButton asChild>
                            <Link
                              href={`/chats/${conv.id}`}
                              className={
                                pathname === `/chats/${conv.id}`
                                  ? 'bg-accent'
                                  : ''
                              }
                            >
                              <MessageSquare className="h-4 w-4" />
                              <span className="truncate">{conv.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))
                  )}
                </>
              )}

              {otherConversations.length === 0 && (
                <div className="px-4 py-2 text-sm text-muted-foreground">
                  No other conversations
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </>
  );
}
