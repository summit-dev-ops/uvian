'use client';

import * as React from 'react';
import { UserPlus } from 'lucide-react';
import { DropdownMenuItem } from '@org/ui';
import { MODAL_IDS, usePageActionContext } from '~/components/shared/page-actions/page-action-context';
const MEMBERS_ACTION_IDS = {
  INVITE_MEMBERS: 'invite-members',
} as const;

/**
 * Space members page-specific actions component
 * Uses PageActionContext for modal management
 */
export function SpaceMembersPageActions() {
  const context = usePageActionContext();

  const handleInviteMembers = React.useCallback(async () => {
    // Open the invite members modal
    context.openModal(MODAL_IDS.INVITE_MEMBERS);
  }, [context]);

  return (
    <>
      <DropdownMenuItem
        onClick={handleInviteMembers}
        className="cursor-pointer"
        disabled={context.isActionExecuting(MEMBERS_ACTION_IDS.INVITE_MEMBERS)}
      >
        <UserPlus className="mr-2 h-4 w-4" />
        <span>Invite Members</span>
      </DropdownMenuItem>
    </>
  );
}
