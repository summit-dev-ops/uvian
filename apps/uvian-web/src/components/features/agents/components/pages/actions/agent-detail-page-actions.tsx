'use client';

import * as React from 'react';
import { Trash2, RefreshCw } from 'lucide-react';
import { DropdownMenuItem } from '@org/ui';
import { usePageActionContext } from '~/components/shared/ui/pages/page-actions/page-action-context';
import { MODAL_IDS, useModalContext } from '~/components/shared/ui/modals';
import { AGENT_DETAIL_ACTION_IDS } from './agent-detail-page-action-provider';

interface AgentDetailPageActionsProps {
  accountId: string;
  agentId: string;
}

export function AgentDetailPageActions({
  accountId,
  agentId,
}: AgentDetailPageActionsProps) {
  const actionContext = usePageActionContext();
  const modalContext = useModalContext();

  const handleDelete = React.useCallback(() => {
    modalContext.openModal(MODAL_IDS.CONFIRM_DELETE, {
      onConfirmActionId: AGENT_DETAIL_ACTION_IDS.DELETE_AGENT,
    });
  }, [modalContext]);

  const handleRefresh = React.useCallback(async () => {
    await actionContext.executeAction(AGENT_DETAIL_ACTION_IDS.REFRESH_AGENT);
  }, [actionContext]);

  return (
    <>
      <DropdownMenuItem
        onClick={handleRefresh}
        className="cursor-pointer"
        disabled={actionContext.isActionExecuting(
          AGENT_DETAIL_ACTION_IDS.REFRESH_AGENT
        )}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        <span>Refresh</span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleDelete}
        className="cursor-pointer text-red-500"
        disabled={actionContext.isActionExecuting(
          AGENT_DETAIL_ACTION_IDS.DELETE_AGENT
        )}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        <span>Delete Agent</span>
      </DropdownMenuItem>
    </>
  );
}
