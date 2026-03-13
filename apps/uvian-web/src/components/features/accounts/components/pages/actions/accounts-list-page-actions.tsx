'use client';

import * as React from 'react';
import { RefreshCw } from 'lucide-react';
import { DropdownMenuItem } from '@org/ui';
import { usePageActionContext } from '~/components/shared/ui/pages/page-actions/page-action-context';

export function AccountsListPageActions() {
  const actionContext = usePageActionContext();

  const handleRefresh = React.useCallback(async () => {
    await actionContext.executeAction('refresh-accounts');
  }, [actionContext]);

  return (
    <DropdownMenuItem onClick={handleRefresh} className="cursor-pointer">
      <RefreshCw className="mr-2 h-4 w-4" />
      <span>Refresh</span>
    </DropdownMenuItem>
  );
}
