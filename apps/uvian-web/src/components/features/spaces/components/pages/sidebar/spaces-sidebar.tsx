'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Users } from 'lucide-react';
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
import { spacesQueries } from '~/lib/domains/spaces/api';
import { chatQueries } from '~/lib/domains/chat/api/queries';
import { useUserSessionStore } from '~/components/features/user/hooks/use-user-store';
import type { ConversationUI } from '~/lib/domains/chat/types';
import type { SpaceMemberUI } from '~/lib/domains/spaces/types';

interface SpacesSidebarProps {
  spaceId: string;
}

export function SpacesSidebar({ spaceId }: SpacesSidebarProps) {
  const pathname = usePathname();
  const { activeProfileId } = useUserSessionStore();
  const [view, setView] = React.useState<'conversations' | 'members'>(
    'conversations'
  );

  const { data: space } = useQuery(
    spacesQueries.space(activeProfileId, spaceId)
  );

  const { data: allConversations = [] } = useQuery(
    chatQueries.conversations(activeProfileId)
  );

  const conversations = allConversations.filter(
    (c: ConversationUI) => c.resourceScopeId === spaceId
  );

  const { data: members = [] } = useQuery(
    spacesQueries.spaceMembers(activeProfileId, spaceId)
  );

  return (
    <>
      <SidebarHeader className="pt-4">
        <div className="px-2">
          <h2 className="text-sm font-semibold truncate">
            {space?.name || 'Space'}
          </h2>
          <p className="text-xs text-muted-foreground">
            {members.length} members · {conversations.length} conversations
          </p>
        </div>
      </SidebarHeader>

      <SidebarHeader className="pb-0">
        <div className="flex gap-1">
          <Button
            variant={view === 'conversations' ? 'secondary' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setView('conversations')}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Chat
          </Button>
          <Button
            variant={view === 'members' ? 'secondary' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setView('members')}
          >
            <Users className="h-4 w-4 mr-1" />
            Members
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {view === 'conversations' && (
          <SidebarGroup className="mt-2">
            <SidebarGroupContent>
              <SidebarMenu>
                {conversations.length > 0 ? (
                  (conversations as ConversationUI[]).map((conv) => (
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
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-muted-foreground">
                    No conversations yet
                  </div>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {view === 'members' && (
          <SidebarGroup className="mt-2">
            <SidebarGroupContent>
              <SidebarMenu>
                {(members as SpaceMemberUI[]).length > 0 ? (
                  (members as SpaceMemberUI[]).map((member) => (
                    <SidebarMenuItem key={member.profileId}>
                      <SidebarMenuButton asChild>
                        <Link href={`/profiles/${member.profileId}`}>
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                            {member.profile?.displayName?.[0]?.toUpperCase() ||
                              '?'}
                          </div>
                          <span className="truncate">
                            {member.profile?.displayName || 'Unknown'}
                          </span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {member.role?.name}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-muted-foreground">
                    No members found
                  </div>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </>
  );
}
