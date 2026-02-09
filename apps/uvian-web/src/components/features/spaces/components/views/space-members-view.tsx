'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { spacesQueries } from '~/lib/domains/spaces/api/queries';
import {
  Button,
  Card,
  CardContent,
  Checkbox,
  Badge,
  Skeleton,
  ScrollArea,
} from '@org/ui';
import { useSpaceMemberActions } from '../../hooks/use-space-member-actions';
import { createArraySelectionState } from '~/components/shared/actions/utils/create-selection-state';
import { ActionManagerProvider } from '~/components/shared/actions/hocs/with-action-manager';

interface SpaceMembersViewProps {
  spaceId: string;
}

export function SpaceMembersView({ spaceId }: SpaceMembersViewProps) {
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Fetch space and members
  const { data: space } = useQuery(spacesQueries.space(spaceId));
  const {
    data: members,
    isLoading,
    error,
  } = useQuery(spacesQueries.spaceMembers(spaceId));

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

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center flex-col space-y-4">
        <Card className="p-6 max-w-md">
          <CardContent className="text-center space-y-4">
            <h2 className="text-xl font-bold text-destructive">
              Error loading space members
            </h2>
            <p className="text-muted-foreground">{error.message}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
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
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Space Members</h1>
            <p className="text-muted-foreground">
              Manage members and their roles in {space?.name || 'this space'}
            </p>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {/* Members list */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="h-16">
                  <CardContent className="h-full flex items-center justify-center">
                    <Skeleton className="h-4 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : members?.length === 0 ? (
            <Card className="py-12">
              <CardContent className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <UserPlus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">No members yet</h3>
                  <p className="text-sm text-muted-foreground">
                    {isAdmin
                      ? 'Invite your team to start collaborating.'
                      : 'You are the only member so far.'}
                  </p>
                </div>
              </CardContent>
            </Card>
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
        </ScrollArea>
      </div>
    </ActionManagerProvider>
  );
}
