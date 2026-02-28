'use client';

import * as React from 'react';
import Link from 'next/link';
import { Settings, LogOut } from 'lucide-react';

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
import { useAuth } from '~/lib/auth/auth-context';
import { ConfirmDialog } from '../../dialogs/confirm-dialog';

export function ProfileMenu() {
  const { user, signOut } = useAuth();
  const [showConfirmLogout, setShowConfirmLogout] = React.useState(false);

  const displayName = user?.email?.split('@')[0] || 'User';
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSignOut = async () => {
    setShowConfirmLogout(false);
    await signOut();
  };

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
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={displayName} />
              ) : (
                <AvatarFallback className="text-xs">
                  {getInitials(displayName)}
                </AvatarFallback>
              )}
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Profile</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem className="cursor-pointer">
            <Avatar className="mr-2 h-6 w-6">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={displayName} />
              ) : (
                <AvatarFallback className="text-xs">
                  {getInitials(displayName)}
                </AvatarFallback>
              )}
            </Avatar>
            {displayName}
          </DropdownMenuItem>

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
