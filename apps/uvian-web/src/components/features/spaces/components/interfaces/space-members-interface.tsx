'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { spacesQueries } from '~/lib/domains/spaces/api/queries';
import {
  InterfaceLayout,
  InterfaceHeader,
  InterfaceHeaderContent,
  InterfaceContent,
} from '~/components/shared/ui/interfaces/interface-layout';
import {
  InterfaceError,
  InterfaceLoading,
  InterfaceEmpty,
} from '~/components/shared/ui/interfaces';
import { Card, CardContent, Checkbox, Badge } from '@org/ui';
import { useSpaceMemberActions } from '../../hooks/use-space-member-actions';
import { createArraySelectionState } from '~/components/shared/actions/utils/create-selection-state';
import { ActionManagerProvider } from '~/components/shared/actions/hocs/with-action-manager';
import { useUserSessionStore } from '~/components/features/user/hooks/use-user-store';

interface SpaceMembersInterfaceProps {
  spaceId: string;
}

export function SpaceMembersInterface({ spaceId }: SpaceMembersInterfaceProps) {
  const { activeProfileId } = useUserSessionStore();
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Fetch space and members
  const { data: space } = useQuery(
    spacesQueries.space(activeProfileId, spaceId)
  );
  const {
    data: members,
    isLoading,
    error,
  } = useQuery(spacesQueries.spaceMembers(activeProfileId, spaceId));

  // Check if current user is admin
  const isAdmin = space?.userRole === 'admin';

  // Build selection state from selected member IDs
  const selectedMembers = (members || []).filter((member) =>
    selectedMemberIds.includes(member.profileId)
  );
  const selectionState = createArraySelectionState(selectedMembers);

  // Get action configuration from hook
  const { actionParams, actionConfig } = useSpaceMemberActions({
    spaceId,
    members,
    isAdmin,
    setSelectedMemberIds,
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMemberIds(members?.map((m) => m.profileId) || []);
    } else {
      setSelectedMemberIds([]);
    }
  };

  const handleSelectMember = (profileId: string, checked: boolean) => {
    if (checked) {
      setSelectedMemberIds((prev) => [...prev, profileId]);
    } else {
      setSelectedMemberIds((prev) => prev.filter((id) => id !== profileId));
    }
  };

  // Early return for error state
  if (error) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title="Space Members"
            subtitle="Error loading members"
            actions={
              <button
                onClick={() => window.history.back()}
                className="px-3 py-1 text-sm border rounded hover:bg-accent"
              >
                Back
              </button>
            }
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceError
            variant="card"
            title="Failed to Load Space Members"
            message={
              error.message ||
              'There was an error loading the space members. Please try again.'
            }
            showRetry={true}
            showHome={true}
            onRetry={() => window.location.reload()}
          />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  // Early return for loading state
  if (isLoading) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title="Space Members"
            subtitle="Loading members..."
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceLoading
            variant="default"
            message="Loading space members..."
            size="lg"
            className="min-h-[400px]"
          />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  return (
    <ActionManagerProvider
      selectionState={selectionState}
      actionConfig={actionConfig}
      params={actionParams}
      showToolbar={true}
      toolbarProps={{
        className: 'mb-4 p-3 bg-primary/10 rounded-lg',
        layout: 'horizontal',
      }}
    >
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title="Space Members"
            subtitle={`Manage members and their roles in ${
              space?.name || 'this space'
            }`}
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          {/* Members list */}
          {members?.length === 0 ? (
            <InterfaceEmpty
              variant="card"
              title="No members yet"
              message={
                isAdmin
                  ? 'Invite your team to start collaborating.'
                  : 'You are the only member so far.'
              }
              action={
                isAdmin && (
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
                    <UserPlus className="h-4 w-4 mr-2 inline" />
                    Invite Members
                  </button>
                )
              }
            />
          ) : (
            <div className="space-y-3">
              {/* Select all checkbox */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={
                        !!members &&
                        members.length > 0 &&
                        selectedMemberIds.length === members.length
                      }
                      onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {selectedMemberIds.length > 0
                        ? `${selectedMemberIds.length} of ${
                            members?.length || 0
                          } selected`
                        : 'Select all members'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Members */}
              {members?.map((member) => (
                <Card
                  key={member.profileId}
                  className={`transition-colors ${
                    selectedMemberIds.includes(member.profileId)
                      ? 'bg-primary/5 border-primary/30'
                      : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedMemberIds.includes(member.profileId)}
                          onCheckedChange={(checked) =>
                            handleSelectMember(member.profileId, !!checked)
                          }
                        />
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="font-medium">
                            {member.profile?.displayName?.[0] || '?'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">
                            {member.profile?.displayName || 'Unknown Member'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Joined{' '}
                            {new Date(member.joinedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            member.role?.name === 'admin'
                              ? 'default'
                              : 'secondary'
                          }
                          className="capitalize"
                        >
                          <span
                            className={`inline-block h-2 w-2 rounded-full mr-2 ${
                              member.role?.name === 'admin'
                                ? 'bg-green-500'
                                : 'bg-blue-500'
                            }`}
                          />
                          {member.role?.name || 'member'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </InterfaceContent>
      </InterfaceLayout>
    </ActionManagerProvider>
  );
}
