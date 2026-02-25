'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check, User, Settings, LogOut } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Button,
} from '@org/ui';
import { useUserSessionStore } from '~/components/features/user/hooks/use-user-store';
import { useQuery } from '@tanstack/react-query';
import { profileQueries } from '~/lib/domains/profile/api/queries';
import type { ProfileUI } from '~/lib/domains/profile/types';
import { useAuth } from '~/lib/auth/auth-context';
import { ConfirmDialog } from '../../dialogs/confirm-dialog';

export function ProfileMenu() {
  const { activeProfileId, setActiveProfile } = useUserSessionStore();
  const { signOut } = useAuth();
  const [showConfirmLogout, setShowConfirmLogout] = React.useState(false);

  const { data: userProfiles = [], isLoading } = useQuery(
    profileQueries.userProfiles()
  );

  const humanProfiles = userProfiles.filter(
    (p: ProfileUI) => p.type === 'human'
  );

  const activeProfile = humanProfiles.find(
    (p: ProfileUI) => p.id === activeProfileId
  );

  const handleProfileSelect = (profileId: string) => {
    setActiveProfile(profileId);
  };

  const handleSignOut = async () => {
    setShowConfirmLogout(false);
    await signOut();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" className="rounded-full" disabled>
        <User className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-9 w-9"
            suppressHydrationWarning
          >
            <Avatar className="h-8 w-8">
              {activeProfile?.avatarUrl ? (
                <AvatarImage
                  src={activeProfile.avatarUrl}
                  alt={activeProfile.displayName}
                />
              ) : (
                <AvatarFallback className="text-xs">
                  {activeProfile ? getInitials(activeProfile.displayName) : '?'}
                </AvatarFallback>
              )}
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Profile</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {humanProfiles.map((profile: ProfileUI) => (
            <DropdownMenuItem
              key={profile.id}
              onSelect={() => handleProfileSelect(profile.id)}
              className="cursor-pointer"
            >
              <Avatar className="mr-2 h-6 w-6">
                {profile.avatarUrl ? (
                  <AvatarImage
                    src={profile.avatarUrl}
                    alt={profile.displayName}
                  />
                ) : (
                  <AvatarFallback className="text-xs">
                    {getInitials(profile.displayName)}
                  </AvatarFallback>
                )}
              </Avatar>
              {profile.displayName}
              {profile.id === activeProfileId && (
                <Check className="ml-auto h-4 w-4" />
              )}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={() => setShowConfirmLogout(true)}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={showConfirmLogout}
        onOpenChange={setShowConfirmLogout}
        title="Sign out"
        description="Are you sure you want to sign out?"
        confirmText="Sign out"
        variant="destructive"
        onConfirm={handleSignOut}
      />
    </>
  );
}
