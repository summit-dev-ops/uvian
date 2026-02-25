'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus } from 'lucide-react';
import { Button, Input, ItemGroup } from '@org/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@org/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileQueries, profileMutations } from '~/lib/domains/profile/api';
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
import { ProfilesListItem } from './profiles-list-item';
import { MODAL_IDS, useModalContext } from '~/components/shared/ui/modals';

export function ProfilesListInterface() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const modalContext = useModalContext();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedType, setSelectedType] = React.useState<string>('all');
  const [selectedStatus, setSelectedStatus] = React.useState<string>('all');

  const {
    data: profiles = [],
    isLoading,
    error,
    refetch,
  } = useQuery(profileQueries.userProfiles());

  const { mutate: deleteProfile } = useMutation(
    profileMutations.deleteProfile(queryClient)
  );

  const filteredProfiles = React.useMemo(() => {
    let filtered = profiles || [];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (profile) =>
          profile.displayName.toLowerCase().includes(query) ||
          profile.bio?.toLowerCase().includes(query)
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter((profile) => profile.type === selectedType);
    }

    if (selectedStatus === 'active') {
      filtered = filtered.filter((profile) => profile.isActive);
    } else if (selectedStatus === 'inactive') {
      filtered = filtered.filter((profile) => !profile.isActive);
    }

    return filtered;
  }, [profiles, searchQuery, selectedType, selectedStatus]);

  const handleCreateProfile = React.useCallback(() => {
    modalContext.openModal(MODAL_IDS.CREATE_PROFILE, {
      onConfirmActionId: 'create-profile',
    });
  }, [modalContext]);

  const handleEditProfile = React.useCallback(
    (profile: ProfileUI) => {
      router.push(`/profiles/${profile.id}/edit`);
    },
    [router]
  );

  const handleDeleteProfile = React.useCallback(
    (profile: ProfileUI) => {
      modalContext.openModal(MODAL_IDS.CONFIRM_DELETE, {
        onConfirm: () => {
          deleteProfile({ profileId: profile.id });
        },
        title: 'Delete Profile',
        description: `Are you sure you want to delete "${profile.displayName}"? This action cannot be undone.`,
      });
    },
    [deleteProfile, modalContext]
  );

  if (error) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title="Profiles"
            subtitle="Error loading profiles"
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceError
            title="Failed to Load Profiles"
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
          <InterfaceHeaderContent title="Profiles" subtitle="Loading..." />
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
            title="Profiles"
            subtitle={`${filteredProfiles.length} profile${
              filteredProfiles.length !== 1 ? 's' : ''
            }`}
            actions={
              <Button onClick={handleCreateProfile}>
                <Plus className="mr-2 h-4 w-4" />
                Create Profile
              </Button>
            }
          />
        </InterfaceHeader>

        <InterfaceContent spacing="compact">
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search profiles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="human">Human</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </InterfaceContent>

        <InterfaceContent spacing="default">
          {filteredProfiles.length > 0 ? (
            <ItemGroup>
              {filteredProfiles.map((profile) => (
                <ProfilesListItem
                  key={profile.id}
                  profile={profile}
                  onEdit={handleEditProfile}
                  onDelete={handleDeleteProfile}
                />
              ))}
            </ItemGroup>
          ) : (
            <InterfaceEmpty
              title="No profiles found"
              message={
                searchQuery ||
                selectedType !== 'all' ||
                selectedStatus !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Create your first profile to get started.'
              }
              action={
                !searchQuery &&
                selectedType === 'all' &&
                selectedStatus === 'all' ? (
                  <Button onClick={handleCreateProfile}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Profile
                  </Button>
                ) : undefined
              }
            />
          )}
        </InterfaceContent>
      </InterfaceContainer>
    </InterfaceLayout>
  );
}
