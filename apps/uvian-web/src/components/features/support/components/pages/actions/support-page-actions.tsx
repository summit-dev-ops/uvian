'use client';

import * as React from 'react';
import { RefreshCw, MessageCircle } from 'lucide-react';
import { DropdownMenuItem } from '@org/ui';
import { usePageActionContext } from '~/components/shared/ui/pages/page-actions/page-action-context';

const SUPPORT_ACTION_IDS = {
  CONTACT_SUPPORT: 'contact-support',
  REFRESH_SUPPORT: 'refresh-support',
} as const;

/**
 * Support page-specific actions component
 * Provides UI for support-related actions
 */
export function SupportPageActions() {
  const context = usePageActionContext();

  const handleContactSupport = React.useCallback(() => {
    context.openModal(SUPPORT_ACTION_IDS.CONTACT_SUPPORT);
  }, [context]);

  const handleRefresh = React.useCallback(async () => {
    await context.executeAction(SUPPORT_ACTION_IDS.REFRESH_SUPPORT);
  }, [context]);

  return (
    <>
      <DropdownMenuItem
        onClick={handleContactSupport}
        className="cursor-pointer"
        disabled={context.isActionExecuting(SUPPORT_ACTION_IDS.CONTACT_SUPPORT)}
      >
        <MessageCircle className="mr-2 h-4 w-4" />
        <span>
          {context.isActionExecuting(SUPPORT_ACTION_IDS.CONTACT_SUPPORT)
            ? 'Opening...'
            : 'Contact Support'}
        </span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleRefresh}
        className="cursor-pointer"
        disabled={context.isActionExecuting(SUPPORT_ACTION_IDS.REFRESH_SUPPORT)}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        <span>Refresh</span>
      </DropdownMenuItem>
    </>
  );
}
