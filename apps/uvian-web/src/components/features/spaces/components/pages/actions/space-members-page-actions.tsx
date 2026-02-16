'use client';

import * as React from 'react';
import { UserPlus } from 'lucide-react';
import { DropdownMenuItem } from '@org/ui';
import { usePageActionContext } from '~/components/shared/ui/pages/page-actions/page-action-context';
import { MODAL_IDS, useModalContext } from '~/components/shared/ui/modals';
const MEMBERS_ACTION_IDS = {
  INVITE_PROFILES: 'invite-profiles',
} as const;

/**
 * Space members page-specific actions component
 * Uses PageActionContext for modal management
 */
export function SpaceMembersPageActions() {
  const actionContext = usePageActionContext();
  const modalContext = useModalContext();

  const handleInviteMembers = React.useCallback(async () => {
    // Open the invite members modal
    modalContext.openModal(MODAL_IDS.INVITE_PROFILES);
  }, [modalContext]);

  return (
    <>
      <DropdownMenuItem
        onClick={handleInviteMembers}
        className="cursor-pointer"
        disabled={actionContext.isActionExecuting(
          MEMBERS_ACTION_IDS.INVITE_PROFILES
        )}
      >
        <UserPlus className="mr-2 h-4 w-4" />
        <span>Invite Members</span>
      </DropdownMenuItem>
    </>
  );
}
