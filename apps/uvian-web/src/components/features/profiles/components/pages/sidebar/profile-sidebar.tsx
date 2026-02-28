'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, Users, Clock } from 'lucide-react';
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
  Avatar,
  AvatarFallback,
} from '@org/ui';
import { profileQueries } from '~/lib/domains/profile/api/queries';
import type { ProfileUI } from '~/lib/domains/profile/types';

interface ProfileSidebarProps {
  profileId: string;
}

export function ProfileSidebar({ profileId }: ProfileSidebarProps) {
  const pathname = usePathname();
  const [view, setView] = React.useState<'agents' | 'spaces' | 'activity'>(
    'agents'
  );

  const { data: profile } = useQuery(profileQueries.profile(profileId));
  const { data: allProfiles = [] } = useQuery(profileQueries.userProfiles());

  const agents = (allProfiles as ProfileUI[]).filter(
    (p) => p.type === 'agent' && p.userId === profile?.userId
  );

  return (
    <>
      <SidebarHeader className="pt-4">
        <div className="flex items-center gap-3 px-2">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10">
              {profile?.displayName?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold truncate">
              {profile?.displayName || 'Profile'}
            </h2>
            <p className="text-xs text-muted-foreground capitalize">
              {profile?.type || 'user'}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarHeader className="pb-0">
        <div className="flex gap-1">
          <Button
            variant={view === 'agents' ? 'secondary' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setView('agents')}
          >
            <Bot className="h-4 w-4 mr-1" />
            Agents
          </Button>
          <Button
            variant={view === 'spaces' ? 'secondary' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setView('spaces')}
          >
            <Users className="h-4 w-4 mr-1" />
            Spaces
          </Button>
          <Button
            variant={view === 'activity' ? 'secondary' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setView('activity')}
          >
            <Clock className="h-4 w-4 mr-1" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {view === 'agents' && (
          <SidebarGroup className="mt-2">
            <SidebarGroupContent>
              <SidebarMenu>
                {agents.length > 0 ? (
                  agents.map((agent) => (
                    <SidebarMenuItem key={agent.id}>
                      <SidebarMenuButton asChild>
                        <Link
                          href={`/profiles/${agent.id}`}
                          className={
                            pathname === `/profiles/${agent.id}`
                              ? 'bg-accent'
                              : ''
                          }
                        >
                          <Bot className="h-4 w-4" />
                          <span className="truncate">{agent.displayName}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-muted-foreground">
                    No agents
                  </div>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {view === 'spaces' && (
          <SidebarGroup className="mt-2">
            <SidebarGroupContent>
              <SidebarMenu>
                <div className="px-4 py-2 text-sm text-muted-foreground">
                  Coming soon - spaces this profile is member of
                </div>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {view === 'activity' && (
          <SidebarGroup className="mt-2">
            <SidebarGroupContent>
              <SidebarMenu>
                <div className="px-4 py-2 text-sm text-muted-foreground">
                  Coming soon - recent activity
                </div>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </>
  );
}
