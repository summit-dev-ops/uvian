'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Users, ListChecks } from 'lucide-react';
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
import { jobQueries } from '~/lib/domains/jobs/api/queries';
import type { ConversationUI } from '~/lib/domains/chat/types';
import type { SpaceMemberUI } from '~/lib/domains/spaces/types';

interface SpacesSidebarProps {
  spaceId: string;
}

export function SpacesSidebar({ spaceId }: SpacesSidebarProps) {
  const pathname = usePathname();
  const [view, setView] = React.useState<'conversations' | 'members' | 'jobs'>(
    'conversations'
  );

  const { data: space } = useQuery(spacesQueries.space(spaceId));

  const { data: allConversations = [] } = useQuery(chatQueries.conversations());

  const conversations = allConversations.filter(
    (c: ConversationUI) => c.resourceScopeId === spaceId
  );

  const { data: members = [] } = useQuery(spacesQueries.spaceMembers(spaceId));

  const { data: jobsData } = useQuery(
    jobQueries.listBySpace(spaceId, {
      limit: 1,
      page: 1,
    })
  );

  const jobCount = jobsData?.total || 0;

  return (
    <>
      <SidebarHeader className="pt-4">
        <div className="px-2">
          <h2 className="text-sm font-semibold truncate">
            {space?.name || 'Space'}
          </h2>
          <p className="text-xs text-muted-foreground">
            {members.length} members · {conversations.length} conversations ·{' '}
            {jobCount} jobs
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
          <Button
            variant={view === 'jobs' ? 'secondary' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setView('jobs')}
          >
            <ListChecks className="h-4 w-4 mr-1" />
            Jobs
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
                    <SidebarMenuItem key={member.userId}>
                      <SidebarMenuButton asChild>
                        <Link
                          href={`/profiles/${
                            member.profile?.id || member.userId
                          }`}
                        >
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

        {view === 'jobs' && (
          <SidebarGroup className="mt-2">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link
                      href={`/spaces/${spaceId}/jobs`}
                      className={
                        pathname === `/spaces/${spaceId}/jobs`
                          ? 'bg-accent'
                          : ''
                      }
                    >
                      <ListChecks className="h-4 w-4" />
                      <span className="truncate">View all {jobCount} jobs</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </>
  );
}
