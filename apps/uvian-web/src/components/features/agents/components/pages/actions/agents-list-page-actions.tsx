'use client';

import * as React from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { DropdownMenuItem } from '@org/ui';
import { usePageActionContext } from '~/components/shared/ui/pages/page-actions/page-action-context';
import { MODAL_IDS, useModalContext } from '~/components/shared/ui/modals';
import { AGENTS_LIST_ACTION_IDS } from './agents-list-page-action-provider';

export function AgentsListPageActions() {
  const actionContext = usePageActionContext();
  const modalContext = useModalContext();

  const handleNewAgent = React.useCallback(() => {
    modalContext.openModal(MODAL_IDS.CREATE_AGENT, {
      onConfirmActionId: AGENTS_LIST_ACTION_IDS.CREATE_AGENT,
    });
  }, [modalContext]);

  const handleRefresh = React.useCallback(async () => {
    await actionContext.executeAction(AGENTS_LIST_ACTION_IDS.REFRESH_AGENTS);
  }, [actionContext]);

  return (
    <>
      <DropdownMenuItem
        onClick={handleNewAgent}
        className="cursor-pointer"
        disabled={actionContext.isActionExecuting(
          AGENTS_LIST_ACTION_IDS.CREATE_AGENT
        )}
      >
        <Plus className="mr-2 h-4 w-4" />
        <span>
          {actionContext.isActionExecuting(AGENTS_LIST_ACTION_IDS.CREATE_AGENT)
            ? 'Creating...'
            : 'New Agent'}
        </span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleRefresh}
        className="cursor-pointer"
        disabled={actionContext.isActionExecuting(
          AGENTS_LIST_ACTION_IDS.REFRESH_AGENTS
        )}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        <span>Refresh</span>
      </DropdownMenuItem>
    </>
  );
}
