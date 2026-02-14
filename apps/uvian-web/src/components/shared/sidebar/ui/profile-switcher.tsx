'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, User } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@org/ui';
import { useUserSessionStore } from '~/components/features/user/hooks/use-user-store';
import { useQuery } from '@tanstack/react-query';
import { profileQueries } from '~/lib/domains/profile/api/queries';
import type { ProfileUI } from '~/lib/domains/profile/types';

export function ProfileSwitcher() {
  const { activeProfileId, setActiveProfile } = useUserSessionStore();

  // Fetch user's profiles from /api/users/me/profiles
  const { data: userProfiles = [], isLoading } = useQuery(
    profileQueries.userProfiles()
  );

  // Filter for human profiles only
  const humanProfiles = userProfiles.filter(
    (p: ProfileUI) => p.type === 'human'
  );

  const activeProfile =
    humanProfiles.find((p: ProfileUI) => p.id === activeProfileId) ||
    humanProfiles[0];

  const [selectedProfileId, setSelectedProfileId] = React.useState(
    activeProfile?.id || ''
  );

  // Update selected profile when active profile changes
  React.useEffect(() => {
    if (activeProfile?.id) {
      setSelectedProfileId(activeProfile.id);
    }
  }, [activeProfile?.id]);

  const handleProfileSelect = (profileId: string) => {
    setSelectedProfileId(profileId);
    setActiveProfile(profileId);
  };

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <User className="size-4" />
            </div>
            <div className="flex flex-col gap-0.5 leading-none">
              <span className="font-semibold">Profile</span>
              <span className="">Loading...</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!humanProfiles.length) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <User className="size-4" />
            </div>
            <div className="flex flex-col gap-0.5 leading-none">
              <span className="font-semibold">Profile</span>
              <span className="">No profiles</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Avatar className="h-8 w-8">
                  {activeProfile?.avatarUrl ? (
                    <AvatarImage
                      src={activeProfile.avatarUrl}
                      alt={activeProfile.displayName}
                    />
                  ) : (
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">Profile</span>
                <span className="">
                  {activeProfile?.displayName || 'Select profile'}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width]"
            align="start"
          >
            {humanProfiles.map((profile: ProfileUI) => (
              <DropdownMenuItem
                key={profile.id}
                onSelect={() => handleProfileSelect(profile.id)}
              >
                <Avatar className="mr-2 h-6 w-6">
                  {profile.avatarUrl ? (
                    <AvatarImage
                      src={profile.avatarUrl}
                      alt={profile.displayName}
                    />
                  ) : (
                    <AvatarFallback>
                      <User className="h-3 w-3" />
                    </AvatarFallback>
                  )}
                </Avatar>
                {profile.displayName}
                {profile.id === selectedProfileId && (
                  <Check className="ml-auto" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
