'use client';

import * as React from 'react';
import { Edit } from 'lucide-react';
import { DropdownMenuItem } from '@org/ui';
import { usePageActionContext } from '~/components/shared/ui/pages/page-actions/page-action-context';

export function UserPageActions() {
  const actionContext = usePageActionContext();

  const handleEditProfile = React.useCallback(async () => {
    await actionContext.executeAction('edit-profile');
  }, [actionContext]);

  return (
    <>
      <DropdownMenuItem onClick={handleEditProfile} className="cursor-pointer">
        <Edit className="mr-2 h-4 w-4" />
        <span>Edit Profile</span>
      </DropdownMenuItem>
    </>
  );
}
