'use client';

import * as React from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { DropdownMenuItem } from '@org/ui';
import { usePageActionContext } from '../../../../shared/page-actions/page-action-context';
import { MODAL_IDS } from '../../../../shared/page-actions/page-action-context';

const LIST_ACTION_IDS = {
  CREATE_CONVERSATION: 'create-conversation',
  REFRESH_CONVERSATIONS: 'refresh-conversations',
} as const;

/**
 * Conversations list page-specific actions component
 * Now uses PageActionContext for all business logic and modal management
 * This is a pure UI component that focuses only on rendering
 */
export function ConversationsListPageActions() {
  const context = usePageActionContext();

  const handleNewConversation = React.useCallback(async () => {
    // Open the create conversation modal
    context.openModal(MODAL_IDS.CREATE_CONVERSATION);
  }, [context]);

  const handleRefresh = React.useCallback(async () => {
    // Execute the refresh action
    await context.executeAction(LIST_ACTION_IDS.REFRESH_CONVERSATIONS);
  }, [context]);

  return (
    <>
      <DropdownMenuItem
        onClick={handleNewConversation}
        className="cursor-pointer"
        disabled={context.isActionExecuting(
          LIST_ACTION_IDS.CREATE_CONVERSATION
        )}
      >
        <Plus className="mr-2 h-4 w-4" />
        <span>
          {context.isActionExecuting(LIST_ACTION_IDS.CREATE_CONVERSATION)
            ? 'Creating...'
            : 'New Conversation'}
        </span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleRefresh}
        className="cursor-pointer"
        disabled={context.isActionExecuting(
          LIST_ACTION_IDS.REFRESH_CONVERSATIONS
        )}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        <span>Refresh</span>
      </DropdownMenuItem>
    </>
  );
}
