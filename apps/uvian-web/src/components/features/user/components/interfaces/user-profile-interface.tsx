'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot,
  User,
  Calendar,
  Pencil,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userQueries } from '~/lib/domains/user/api/queries';
import { profileMutations } from '~/lib/domains/profile/api';
import {
  InterfaceLayout,
  InterfaceHeader,
  InterfaceHeaderContent,
  InterfaceContent,
  InterfaceContainer,
} from '~/components/shared/ui/interfaces';
import {
  InterfaceError,
  InterfaceLoading,
} from '~/components/shared/ui/interfaces';
import { Avatar, AvatarFallback, AvatarImage } from '@org/ui';
import { Button } from '@org/ui';
import { Badge } from '@org/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@org/ui';
import { MODAL_IDS, useModalContext } from '~/components/shared/ui/modals';

interface UserProfileInterfaceProps {
  userId: string;
  className?: string;
}

export function UserProfileInterface({
  userId,
  className,
}: UserProfileInterfaceProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const modalContext = useModalContext();

  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useQuery(userQueries.profileByUserId(userId));

  const { mutate: deleteProfile } = useMutation(
    profileMutations.deleteProfile(queryClient)
  );

  const handleEdit = React.useCallback(() => {
    router.push(`/users/${userId}/edit`);
  }, [router, userId]);

  const handleDelete = React.useCallback(() => {
    if (!profile) return;
    modalContext.openModal(MODAL_IDS.CONFIRM_DELETE, {
      onConfirm: () => {
        deleteProfile(
          { profileId: profile.id },
          {
            onSuccess: () => {
              router.push('/users');
            },
          }
        );
      },
      title: 'Delete Profile',
      description: `Are you sure you want to delete "${profile.displayName}"? This action cannot be undone.`,
    });
  }, [profile, deleteProfile, modalContext, router]);

  if (isLoading) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent title="Profile" subtitle="Loading..." />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceLoading message="Loading profile..." />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  if (error || !profile) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent title="Profile" subtitle="Error" />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceError
            title="Failed to Load Profile"
            message={error?.message || 'Profile not found'}
            showRetry={true}
            onRetry={() => refetch()}
          />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  const TypeIcon = profile.type === 'agent' ? Bot : User;
  const createdDate = new Date(profile.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <InterfaceLayout>
      <InterfaceContainer className={className}>
        <InterfaceHeader>
          <InterfaceHeaderContent
            title="Profile"
            subtitle={profile.type}
            actions={
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" suppressHydrationWarning>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={handleDelete}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            }
          />
        </InterfaceHeader>

        <InterfaceContent spacing="default">
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={profile.avatarUrl || ''}
                  alt={profile.displayName}
                />
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {profile.displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-semibold truncate">
                    {profile.displayName}
                  </h1>
                  <TypeIcon className="h-4 w-4 text-muted-foreground" />
                  {profile.isActive && (
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={profile.type === 'agent' ? 'default' : 'outline'}
                  >
                    {profile.type === 'agent' ? 'Agent' : 'Human'}
                  </Badge>
                  {profile.isActive && (
                    <Badge variant="secondary">Active</Badge>
                  )}
                </div>
              </div>
            </div>

            {profile.bio && (
              <div>
                <h3 className="text-sm font-medium mb-2">Bio</h3>
                <p className="text-sm text-muted-foreground">{profile.bio}</p>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Joined {createdDate}</span>
            </div>
          </div>
        </InterfaceContent>
      </InterfaceContainer>
    </InterfaceLayout>
  );
}
