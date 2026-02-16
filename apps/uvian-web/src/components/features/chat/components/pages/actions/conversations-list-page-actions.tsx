'use client';

import * as React from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { DropdownMenuItem } from '@org/ui';
import { usePageActionContext } from '~/components/shared/ui/pages/page-actions/page-action-context';
import { useModalContext } from '~/components/shared/ui/modals';
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
  const actionContext = usePageActionContext();
  const modalContext = useModalContext()

  const handleNewConversation = React.useCallback(() => {
     modalContext.openModal(LIST_ACTION_IDS.CREATE_CONVERSATION);
  }, [modalContext]);

  const handleRefresh = React.useCallback(async () => {
    // Execute the refresh action
    await actionContext.executeAction(LIST_ACTION_IDS.REFRESH_CONVERSATIONS);
  }, [actionContext]);

  return (
    <>
      <DropdownMenuItem
        onClick={handleNewConversation}
        className="cursor-pointer"
        disabled={actionContext.isActionExecuting(
          LIST_ACTION_IDS.CREATE_CONVERSATION
        )}
      >
        <Plus className="mr-2 h-4 w-4" />
        <span>
          {actionContext.isActionExecuting(LIST_ACTION_IDS.CREATE_CONVERSATION)
            ? 'Creating...'
            : 'New Conversation'}
        </span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleRefresh}
        className="cursor-pointer"
        disabled={actionContext.isActionExecuting(
          LIST_ACTION_IDS.REFRESH_CONVERSATIONS
        )}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        <span>Refresh</span>
      </DropdownMenuItem>
    </>
  );
}
