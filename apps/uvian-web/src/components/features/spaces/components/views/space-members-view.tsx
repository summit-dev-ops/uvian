'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Edit, Shield, UserX, Trash2 } from 'lucide-react';
import { spacesQueries } from '~/lib/domains/spaces/api/queries';
import { spacesMutations } from '~/lib/domains/spaces/api/mutations';
import { Button, Card, CardContent, Checkbox, Badge, Skeleton } from '@org/ui';
import type { SpaceMemberUI } from '~/lib/domains/spaces/types';

interface SpaceMembersViewProps {
  spaceId: string;
}

export function SpaceMembersView({ spaceId }: SpaceMembersViewProps) {
  const queryClient = useQueryClient();
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Fetch space and members
  const { data: space } = useQuery(spacesQueries.space(spaceId));
  const {
    data: members,
    isLoading,
    error,
  } = useQuery(spacesQueries.spaceMembers(spaceId));

  // Mutations
  const { mutate: inviteMember, isPending: isInviting } = useMutation(
    spacesMutations.inviteSpaceMember(queryClient),
  );

  const { mutate: removeMember, isPending: isRemoving } = useMutation(
    spacesMutations.removeSpaceMember(queryClient),
  );

  const { mutate: updateRole, isPending: isUpdating } = useMutation(
    spacesMutations.updateSpaceMemberRole(queryClient),
  );

  // Check if current user is admin
  const isAdmin = space?.userRole === 'admin';

  const handleInviteMember = () => {
    const profileId = prompt('Enter profile ID to invite:')?.trim();
    if (!profileId) return;

    inviteMember({
      spaceId,
      profileId,
      role: { name: 'member' },
    });
  };

  const handleRemoveMember = (memberProfileId: string) => {
    if (confirm(`Remove ${memberProfileId} from this space?`)) {
      removeMember({
        spaceId,
        profileId: memberProfileId,
      });
      setSelectedMemberIds((prev) =>
        prev.filter((id) => id !== memberProfileId),
      );
    }
  };

  const handleUpdateRole = (memberProfileId: string, roleName: string) => {
    updateRole({
      spaceId,
      profileId: memberProfileId,
      role: { name: roleName },
    });
  };

  const handleBulkRemove = () => {
    if (
      confirm(`Remove ${selectedMemberIds.length} member(s) from this space?`)
    ) {
      selectedMemberIds.forEach((profileId) => {
        removeMember({ spaceId, profileId });
      });
      setSelectedMemberIds([]);
    }
  };

  const handleBulkMakeAdmin = () => {
    selectedMemberIds.forEach((profileId) => {
      updateRole({
        spaceId,
        profileId,
        role: { name: 'admin' },
      });
    });
    setSelectedMemberIds([]);
  };

  const handleBulkMakeMember = () => {
    selectedMemberIds.forEach((profileId) => {
      updateRole({
        spaceId,
        profileId,
        role: { name: 'member' },
      });
    });
    setSelectedMemberIds([]);
  };

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
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Space Members</h1>
          <p className="text-muted-foreground">
            Manage members and their roles in {space?.name || 'this space'}
          </p>
        </div>

        {isAdmin && (
          <Button onClick={handleInviteMember} disabled={isInviting}>
            <UserPlus className="h-4 w-4 mr-2" />
            {isInviting ? 'Inviting...' : 'Invite Member'}
          </Button>
        )}
      </div>

      {/* Bulk actions */}
      {selectedMemberIds.length > 0 && isAdmin && (
        <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
          <span className="text-sm">
            {selectedMemberIds.length} member(s) selected
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkMakeAdmin}
            disabled={isUpdating}
          >
            <Shield className="h-4 w-4 mr-1" />
            Make Admin
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkMakeMember}
            disabled={isUpdating}
          >
            <UserX className="h-4 w-4 mr-1" />
            Make Member
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleBulkRemove}
            disabled={isRemoving}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remove
          </Button>
        </div>
      )}

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
            {isAdmin && (
              <Button onClick={handleInviteMember} disabled={isInviting}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite First Member
              </Button>
            )}
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
                    members?.length > 0 &&
                    selectedMemberIds.length === members?.length
                  }
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedMemberIds.length > 0
                    ? `${selectedMemberIds.length} of ${members?.length} selected`
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
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        member.role?.name === 'admin' ? 'default' : 'secondary'
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

                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newRole =
                              member.role?.name === 'admin'
                                ? 'member'
                                : 'admin';
                            handleUpdateRole(member.profileId, newRole);
                          }}
                          disabled={isUpdating}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveMember(member.profileId)}
                          disabled={isRemoving}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
