'use client';

import * as React from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { DropdownMenuItem } from '@org/ui';
import { usePageActionContext } from '~/components/shared/ui/pages/page-actions/page-action-context';
import { MODAL_IDS, useModalContext } from '~/components/shared/ui/modals';

export const JOBS_LIST_ACTION_IDS = {
  CREATE_JOB: 'create-job',
  REFRESH_JOBS: 'refresh-jobs',
} as const;

/**
 * Jobs list page-specific actions component
 * Now uses PageActionContext for all business logic and modal management
 * This is a pure UI component that focuses only on rendering
 */
export function JobsListPageActions() {
  const actionContext = usePageActionContext();
  const modalContext = useModalContext();

  const handleNewJob = React.useCallback(() => {
    modalContext.openModal(MODAL_IDS.CREATE_JOB, {
      onConfirmActionId: JOBS_LIST_ACTION_IDS.CREATE_JOB,
    });
  }, [modalContext]);

  const handleRefresh = React.useCallback(async () => {
    await actionContext.executeAction(JOBS_LIST_ACTION_IDS.REFRESH_JOBS);
  }, [actionContext]);

  return (
    <>
      <DropdownMenuItem
        onClick={handleNewJob}
        className="cursor-pointer"
        disabled={actionContext.isActionExecuting(
          JOBS_LIST_ACTION_IDS.CREATE_JOB
        )}
      >
        <Plus className="mr-2 h-4 w-4" />
        <span>
          {actionContext.isActionExecuting(JOBS_LIST_ACTION_IDS.CREATE_JOB)
            ? 'Creating...'
            : 'New Job'}
        </span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleRefresh}
        className="cursor-pointer"
        disabled={actionContext.isActionExecuting(
          JOBS_LIST_ACTION_IDS.REFRESH_JOBS
        )}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        <span>Refresh</span>
      </DropdownMenuItem>
    </>
  );
}
