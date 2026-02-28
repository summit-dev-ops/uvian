'use client';

import * as React from 'react';
import { User } from 'lucide-react';

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@org/ui';
import { useAuth } from '~/lib/auth/auth-context';

export function ProfileSwitcher() {
  const { user } = useAuth();

  const displayName = user?.email?.split('@')[0] || 'User';
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" suppressHydrationWarning>
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-semibold">Profile</span>
            <span className="">{displayName}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
