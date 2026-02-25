'use client';

import * as React from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { DropdownMenuItem } from '@org/ui';
import { usePageActionContext } from '~/components/shared/ui/pages/page-actions/page-action-context';
import { MODAL_IDS, useModalContext } from '~/components/shared/ui/modals';

const SPACES_ACTION_IDS = {
  CREATE_SPACE: 'create-space',
  REFRESH_SPACES: 'refresh-spaces',
} as const;

export function SpacesListPageActions() {
  const actionContext = usePageActionContext();
  const modalContext = useModalContext();

  const handleCreateSpace = React.useCallback(() => {
    modalContext.openModal(MODAL_IDS.CREATE_SPACE, {
      onConfirmActionId: SPACES_ACTION_IDS.CREATE_SPACE,
    });
  }, [modalContext]);

  const handleRefresh = React.useCallback(async () => {
    await actionContext.executeAction(SPACES_ACTION_IDS.REFRESH_SPACES);
  }, [actionContext]);

  return (
    <>
      <DropdownMenuItem
        onClick={handleCreateSpace}
        className="cursor-pointer"
        disabled={actionContext.isActionExecuting(
          SPACES_ACTION_IDS.CREATE_SPACE
        )}
      >
        <Plus className="mr-2 h-4 w-4" />
        <span>
          {actionContext.isActionExecuting(SPACES_ACTION_IDS.CREATE_SPACE)
            ? 'Creating...'
            : 'Create Space'}
        </span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleRefresh}
        className="cursor-pointer"
        disabled={actionContext.isActionExecuting(
          SPACES_ACTION_IDS.REFRESH_SPACES
        )}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        <span>Refresh</span>
      </DropdownMenuItem>
    </>
  );
}
