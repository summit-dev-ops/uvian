'use client';

import * as React from 'react';
import { InviteProfileDialog } from '../../dialogs';
import { usePageActionContext } from '../../pages/page-actions/page-action-context';
import type { ProfileUI } from '~/lib/domains/profile/types';
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

  const [selectedProfiles, setSelectedProfiles] = React.useState<ProfileUI[]>(
    []
  );
  const [selectedRole, setSelectedRole] =
    React.useState<ConversationMemberRole['name']>(defaultRole);

  const isLoading = isActionExecuting(onConfirmActionId);

  const handleProfileSelect = (profile: ProfileUI) => {
    const isAlreadySelected = selectedProfiles.some((p) => p.id === profile.id);
    if (isAlreadySelected) {
      setSelectedProfiles((prev) => prev.filter((p) => p.id !== profile.id));
    } else {
      setSelectedProfiles((prev) => [...prev, profile]);
    }
  };

  const handleRemoveProfile = (profileId: string) => {
    setSelectedProfiles((prev) => prev.filter((p) => p.id !== profileId));
  };

  const handleSubmit = async () => {
    console.log('[INVITE_MODAL] handleSubmit called');
    console.log('[INVITE_MODAL] selectedProfiles:', selectedProfiles);
    console.log('[INVITE_MODAL] conversationId:', conversationId);
    console.log('[INVITE_MODAL] selectedRole:', selectedRole);

    if (selectedProfiles.length === 0) {
      console.log('[INVITE_MODAL] No profiles selected, returning');
      return;
    }

    try {
      const invitations = selectedProfiles.map((profile) => ({
        conversationId: conversationId!,
        targetMemberUserId: profile.id,
        role: { name: selectedRole },
      }));

      console.log('[INVITE_MODAL] Created invitations:', invitations);

      for (const invitation of invitations) {
        console.log('[INVITE_MODAL] Calling executeAction with:', invitation);
        await executeAction(onConfirmActionId, invitation);
        console.log('[INVITE_MODAL] executeAction completed for:', invitation);
      }

      console.log('[INVITE_MODAL] All invitations sent successfully');

      setSelectedProfiles([]);
      setSelectedRole(defaultRole);
      onOpenChange(false);
    } catch (error) {
      console.error('[INVITE_MODAL] Failed to invite members:', error);
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
