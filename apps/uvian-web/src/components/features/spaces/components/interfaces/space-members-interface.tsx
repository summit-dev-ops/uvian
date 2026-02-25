'use client';

import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { spacesQueries } from '~/lib/domains/spaces/api';
import { useUserSessionStore } from '~/components/features/user/hooks/use-user-store';
import {
  InterfaceLayout,
  InterfaceHeader,
  InterfaceHeaderContent,
  InterfaceContent,
  InterfaceContainer,
} from '~/components/shared/ui/interfaces/interface-layout';
import {
  InterfaceError,
  InterfaceLoading,
  InterfaceEmpty,
} from '~/components/shared/ui/interfaces';
import {
  Button,
  Checkbox,
  Avatar,
  AvatarFallback,
  Badge,
  Item,
  ItemContent,
  ItemTitle,
} from '@org/ui';
import { useSpaceMemberActions } from '../../hooks/use-space-member-actions';
import { createArraySelectionState } from '~/components/shared/actions/utils/create-selection-state';
import { ActionManagerProvider } from '~/components/shared/actions/hocs/with-action-manager';
import { MODAL_IDS, useModalContext } from '~/components/shared/ui/modals';

interface SpaceMembersInterfaceProps {
  spaceId: string;
}

export function SpaceMembersInterface({ spaceId }: SpaceMembersInterfaceProps) {
  const { activeProfileId } = useUserSessionStore();
  const modalContext = useModalContext();
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const { data: space } = useQuery(
    spacesQueries.space(activeProfileId, spaceId)
  );
  const {
    data: members,
    isLoading,
    error,
  } = useQuery(spacesQueries.spaceMembers(activeProfileId, spaceId));

  const isAdmin = space?.userRole === 'owner' || space?.userRole === 'admin';

  const selectedMembers = (members || []).filter((member) =>
    selectedMemberIds.includes(member.profileId)
  );
  const selectionState = createArraySelectionState(selectedMembers);

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

  const handleInviteMembers = React.useCallback(() => {
    modalContext.openModal(MODAL_IDS.INVITE_PROFILES, {
      onConfirmActionId: 'invite-profiles',
    });
  }, [modalContext]);

  if (error) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title="Space Members"
            subtitle="Error loading members"
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceError
            title="Failed to Load Space Members"
            message={error.message || 'Something went wrong.'}
            showRetry={true}
            onRetry={() => window.location.reload()}
          />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  if (isLoading) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent title="Space Members" subtitle="Loading..." />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceLoading message="Loading members..." />
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
        className: 'mb-4',
        layout: 'horizontal',
      }}
    >
      <InterfaceLayout>
        <InterfaceContainer>
          <InterfaceHeader>
            <InterfaceHeaderContent
              title="Space Members"
              subtitle={`${members?.length || 0} members in ${
                space?.name || 'this space'
              }`}
              actions={
                isAdmin ? (
                  <Button onClick={handleInviteMembers}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Members
                  </Button>
                ) : undefined
              }
            />
          </InterfaceHeader>

          <InterfaceContent spacing="default">
            {members?.length === 0 ? (
              <InterfaceEmpty
                title="No members yet"
                message={
                  isAdmin
                    ? 'Invite your team to start collaborating.'
                    : 'You are the only member so far.'
                }
                action={
                  isAdmin ? (
                    <Button onClick={handleInviteMembers}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite Members
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-3 py-2 px-3 rounded-md bg-muted/50">
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
                      : 'Select all'}
                  </span>
                </div>

                {members?.map((member) => (
                  <Item
                    key={member.profileId}
                    className={`flex items-center gap-3 ${
                      selectedMemberIds.includes(member.profileId)
                        ? 'bg-primary/5'
                        : ''
                    }`}
                  >
                    <Checkbox
                      checked={selectedMemberIds.includes(member.profileId)}
                      onCheckedChange={(checked) =>
                        handleSelectMember(member.profileId, !!checked)
                      }
                    />
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {member.profile?.displayName?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <ItemContent className="flex-1">
                      <ItemTitle className="text-sm">
                        {member.profile?.displayName || 'Unknown Member'}
                      </ItemTitle>
                    </ItemContent>
                    <Badge
                      variant={
                        member.role?.name === 'admin' ||
                        member.role?.name === 'owner'
                          ? 'default'
                          : 'secondary'
                      }
                      className="capitalize"
                    >
                      {member.role?.name || 'member'}
                    </Badge>
                  </Item>
                ))}
              </div>
            )}
          </InterfaceContent>
        </InterfaceContainer>
      </InterfaceLayout>
    </ActionManagerProvider>
  );
}
