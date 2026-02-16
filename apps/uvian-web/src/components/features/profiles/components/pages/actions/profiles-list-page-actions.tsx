'use client';

import * as React from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { DropdownMenuItem } from '@org/ui';
import { usePageActionContext } from '~/components/shared/ui/pages/page-actions/page-action-context';
import { useModalContext } from '~/components/shared/ui/modals';

const PROFILES_LIST_ACTION_IDS = {
  CREATE_PROFILE: 'create-profile',
  REFRESH_PROFILES: 'refresh-profiles',
} as const;

/**
 * Profiles list page-specific actions component
 */
export function ProfilesListPageActions() {
  const actionContext = usePageActionContext();
  const modalContext = useModalContext();

  const handleCreateProfile = React.useCallback(() => {
    modalContext.openModal(PROFILES_LIST_ACTION_IDS.CREATE_PROFILE);
  }, [modalContext]);

  const handleRefresh = React.useCallback(async () => {
    await actionContext.executeAction(
      PROFILES_LIST_ACTION_IDS.REFRESH_PROFILES
    );
  }, [actionContext]);

  return (
    <>
      <DropdownMenuItem
        onClick={handleCreateProfile}
        className="cursor-pointer"
        disabled={actionContext.isActionExecuting(
          PROFILES_LIST_ACTION_IDS.CREATE_PROFILE
        )}
      >
        <Plus className="mr-2 h-4 w-4" />
        <span>
          {actionContext.isActionExecuting(
            PROFILES_LIST_ACTION_IDS.CREATE_PROFILE
          )
            ? 'Creating...'
            : 'Create Profile'}
        </span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleRefresh}
        className="cursor-pointer"
        disabled={actionContext.isActionExecuting(
          PROFILES_LIST_ACTION_IDS.REFRESH_PROFILES
        )}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        <span>Refresh</span>
      </DropdownMenuItem>
    </>
  );
}
