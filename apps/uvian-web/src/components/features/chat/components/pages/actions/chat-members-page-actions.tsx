'use client';

import * as React from 'react';
import { UserPlus } from 'lucide-react';
import { DropdownMenuItem } from '@org/ui';
import {
  MODAL_IDS,
  usePageActionContext,
} from '~/components/shared/page-actions/page-action-context';

/**
 * Chat members page-specific actions component
 * Uses PageActionContext for modal management
 */
export function ChatMembersPageActions() {
  const context = usePageActionContext();

  const handleInviteMember = React.useCallback(async () => {
    context.openModal(MODAL_IDS.INVITE_MEMBERS);
  }, [context]);

  return (
    <DropdownMenuItem onClick={handleInviteMember}>
      <UserPlus className="mr-2 h-4 w-4" />
      <span>Invite Member</span>
    </DropdownMenuItem>
  );
}
