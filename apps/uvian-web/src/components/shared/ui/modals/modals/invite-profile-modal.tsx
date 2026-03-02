'use client';

import * as React from 'react';
import { InviteProfileDialog } from '../../dialogs';
import { usePageActionContext } from '../../pages/page-actions/page-action-context';
import type { UserSearchResult } from '~/lib/domains/profile/types';
import type { ConversationMemberRole } from '~/lib/domains/chat/types';

export type InviteProfileData = {
  role: ConversationMemberRole;
  profileId: string;
};

export interface InviteProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmActionId: string;
  onCancelActionId?: string;
  conversationId?: string;
  defaultRole?: ConversationMemberRole['name'];
}

export function InviteProfileModal({
  open,
  onOpenChange,
  onConfirmActionId,
  onCancelActionId,
  conversationId,
  defaultRole = 'member',
}: InviteProfileModalProps) {
  const { executeAction, isActionExecuting } = usePageActionContext();

  const [selectedProfiles, setSelectedProfiles] = React.useState<
    UserSearchResult[]
  >([]);
  const [selectedRole, setSelectedRole] =
    React.useState<ConversationMemberRole['name']>(defaultRole);

  const isLoading = isActionExecuting(onConfirmActionId);

  const handleProfileSelect = (profile: UserSearchResult) => {
    const isAlreadySelected = selectedProfiles.some(
      (p) => p.profileId === profile.profileId
    );
    if (isAlreadySelected) {
      setSelectedProfiles((prev) =>
        prev.filter((p) => p.profileId !== profile.profileId)
      );
    } else {
      setSelectedProfiles((prev) => [...prev, profile]);
    }
  };

  const handleRemoveProfile = (profileId: string) => {
    setSelectedProfiles((prev) =>
      prev.filter((p) => p.profileId !== profileId)
    );
  };

  const handleSubmit = async () => {
    if (selectedProfiles.length === 0) {
      return;
    }

    try {
      const invitations = selectedProfiles.map((profile) => ({
        conversationId: conversationId!,
        targetMemberUserId: profile.userId,
        role: { name: selectedRole },
      }));

      for (const invitation of invitations) {
        await executeAction(onConfirmActionId, invitation);
      }

      setSelectedProfiles([]);
      setSelectedRole(defaultRole);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to invite members:', error);
    }
  };

  const handleCancel = async () => {
    if (!isLoading) {
      try {
        if (onCancelActionId) {
          await executeAction(onCancelActionId, {});
        }
        setSelectedProfiles([]);
        setSelectedRole(defaultRole);
        onOpenChange(false);
      } catch (error) {
        console.error('Failed to cancel member invitation:', error);
      }
    }
  };

  return (
    <InviteProfileDialog
      open={open}
      onOpenChange={onOpenChange}
      onProfileSelect={handleProfileSelect}
      selectedProfiles={selectedProfiles}
      selectedRole={selectedRole}
      onRoleChange={setSelectedRole}
      onRemoveProfile={handleRemoveProfile}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submitPending={isLoading}
    />
  );
}
