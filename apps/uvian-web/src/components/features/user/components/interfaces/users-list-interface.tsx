'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { User, MoreHorizontal } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
} from '@org/ui';
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemGroup,
} from '@org/ui';
import { userQueries } from '~/lib/domains/user/api/queries';
import type { ProfileUI } from '~/lib/domains/profile/types';
import {
  InterfaceLayout,
  InterfaceHeader,
  InterfaceHeaderContent,
  InterfaceContent,
  InterfaceContainer,
  InterfaceEmpty,
  InterfaceLoadingSkeleton,
  InterfaceError,
} from '~/components/shared/ui/interfaces';

interface UserWithProfile {
  userId: string;
  role: { name: string };
  profile?: ProfileUI;
}

export function UsersListInterface() {
  const [searchQuery, setSearchQuery] = React.useState('');

  const {
    data: users = [],
    isLoading,
    error,
    refetch,
  } = useQuery(userQueries.userList());

  const userIds = React.useMemo(() => users.map((u) => u.userId), [users]);

  const { data: profilesMap = {} } = useQuery({
    ...userQueries.profilesByUserIds(userIds),
    enabled: userIds.length > 0,
  });

  const usersWithProfiles: UserWithProfile[] = React.useMemo(() => {
    return users.map((user) => ({
      ...user,
      profile: profilesMap[user.userId],
    }));
  }, [users, profilesMap]);

  const filteredUsers = React.useMemo(() => {
    if (!searchQuery.trim()) return usersWithProfiles;

    const query = searchQuery.toLowerCase();
    return usersWithProfiles.filter(
      (user) =>
        user.profile?.displayName?.toLowerCase().includes(query) ||
        user.profile?.bio?.toLowerCase().includes(query)
    );
  }, [usersWithProfiles, searchQuery]);

  if (error) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title="Users"
            subtitle="Error loading users"
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceError
            title="Failed to Load Users"
            message={error.message || 'Something went wrong. Please try again.'}
            showRetry={true}
            onRetry={() => refetch()}
          />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  if (isLoading) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent title="Users" subtitle="Loading..." />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <InterfaceLoadingSkeleton key={i} className="h-16" />
            ))}
          </div>
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  return (
    <InterfaceLayout>
      <InterfaceContainer>
        <InterfaceHeader>
          <InterfaceHeaderContent
            title="Users"
            subtitle={`${filteredUsers.length} user${
              filteredUsers.length !== 1 ? 's' : ''
            }`}
          />
        </InterfaceHeader>

        <InterfaceContent spacing="compact">
          <div className="relative max-w-sm">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </InterfaceContent>

        <InterfaceContent spacing="default">
          {filteredUsers.length > 0 ? (
            <ItemGroup>
              {filteredUsers.map((user) => (
                <UserListItem key={user.userId} user={user} />
              ))}
            </ItemGroup>
          ) : (
            <InterfaceEmpty
              title="No users found"
              message={
                searchQuery
                  ? 'Try adjusting your search.'
                  : "You're the only user in this account."
              }
            />
          )}
        </InterfaceContent>
      </InterfaceContainer>
    </InterfaceLayout>
  );
}

function UserListItem({ user }: { user: UserWithProfile }) {
  const profile = user.profile;

  return (
    <Item asChild>
      <Link href={`/users/${user.userId}`} className="group">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage
              src={profile?.avatarUrl || ''}
              alt={profile?.displayName || 'User'}
            />
            <AvatarFallback className="bg-primary/10 text-primary">
              {(profile?.displayName || 'U').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <ItemContent className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <ItemTitle className="truncate">
                {profile?.displayName || 'Unknown User'}
              </ItemTitle>
              {profile?.isActive && (
                <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
              )}
            </div>
            {profile?.bio && (
              <ItemDescription className="truncate">
                {profile.bio}
              </ItemDescription>
            )}
          </ItemContent>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
              onClick={(e: React.MouseEvent) => e.preventDefault()}
              suppressHydrationWarning
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/users/${user.userId}`}>View Profile</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Link>
    </Item>
  );
}
