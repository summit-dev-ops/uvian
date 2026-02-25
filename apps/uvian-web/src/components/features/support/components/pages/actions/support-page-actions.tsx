'use client';

import * as React from 'react';
import { RefreshCw, MessageCircle } from 'lucide-react';
import { DropdownMenuItem } from '@org/ui';
import { usePageActionContext } from '~/components/shared/ui/pages/page-actions/page-action-context';
import { useModalContext, MODAL_IDS } from '~/components/shared/ui/modals';

const SUPPORT_ACTION_IDS = {
  CONTACT_SUPPORT: 'contact-support',
  REFRESH_SUPPORT: 'refresh-support',
} as const;

/**
 * Support page-specific actions component
 * Provides UI for support-related actions
 */
export function SupportPageActions() {
  const actionContext = usePageActionContext();
  const modalContext = useModalContext();

  const handleContactSupport = React.useCallback(() => {
    modalContext.openModal(MODAL_IDS.CONTACT_SUPPORT, {
      onConfirmActionId: SUPPORT_ACTION_IDS.CONTACT_SUPPORT,
    });
  }, [modalContext]);

  const handleRefresh = React.useCallback(async () => {
    await actionContext.executeAction(SUPPORT_ACTION_IDS.REFRESH_SUPPORT);
  }, [actionContext]);

  return (
    <>
      <DropdownMenuItem
        onClick={handleContactSupport}
        className="cursor-pointer"
        disabled={actionContext.isActionExecuting(
          SUPPORT_ACTION_IDS.CONTACT_SUPPORT
        )}
      >
        <MessageCircle className="mr-2 h-4 w-4" />
        <span>
          {actionContext.isActionExecuting(SUPPORT_ACTION_IDS.CONTACT_SUPPORT)
            ? 'Opening...'
            : 'Contact Support'}
        </span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleRefresh}
        className="cursor-pointer"
        disabled={actionContext.isActionExecuting(
          SUPPORT_ACTION_IDS.REFRESH_SUPPORT
        )}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        <span>Refresh</span>
      </DropdownMenuItem>
    </>
  );
}
