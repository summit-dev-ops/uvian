'use client';

import * as React from 'react';
import { UserPlus } from 'lucide-react';
import { DropdownMenuItem } from '@org/ui';
import { MODAL_IDS, useModalContext } from '~/components/shared/ui/modals';

interface AccountMembersPageActionsProps {
  accountId: string;
}

export function AccountMembersPageActions({
  accountId,
}: AccountMembersPageActionsProps) {
  const modalContext = useModalContext();

  const handleInvite = React.useCallback(() => {
    modalContext.openModal(MODAL_IDS.INVITE_USER_AS_MEMBER, {
      accountId,
    });
  }, [modalContext, accountId]);

  return (
    <>
      <DropdownMenuItem onClick={handleInvite} className="cursor-pointer">
        <UserPlus className="mr-2 h-4 w-4" />
        <span>Invite Member</span>
      </DropdownMenuItem>
    </>
  );
}
