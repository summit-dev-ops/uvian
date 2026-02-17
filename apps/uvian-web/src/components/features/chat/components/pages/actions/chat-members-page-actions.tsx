'use client';

import * as React from 'react';
import { UserPlus } from 'lucide-react';
import { DropdownMenuItem } from '@org/ui';
import { MODAL_IDS, useModalContext } from '~/components/shared/ui/modals';
import { MEMBERS_ACTION_IDS } from './chat-members-page-action-provider';

/**
 * Chat members page-specific actions component
 * Uses PageActionContext for modal management
 */
export function ChatMembersPageActions() {
  const context = useModalContext();

  const handleInviteMember = React.useCallback(async () => {
    context.openModal(MODAL_IDS.INVITE_PROFILES, {onConfirmActionId: MEMBERS_ACTION_IDS.INVITE_PROFILES});
  }, [context]);

  return (
    <DropdownMenuItem onClick={handleInviteMember}>
      <UserPlus className="mr-2 h-4 w-4" />
      <span>Invite Member</span>
    </DropdownMenuItem>
  );
}
