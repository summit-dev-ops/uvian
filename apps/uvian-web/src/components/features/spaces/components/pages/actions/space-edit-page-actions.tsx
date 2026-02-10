'use client';

import * as React from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { DropdownMenuItem } from '@org/ui';
import { MODAL_IDS, usePageActionContext } from '~/components/shared/page-actions/page-action-context';
const EDIT_ACTION_IDS = {
  CANCEL: 'cancel',
  DELETE_SPACE: 'delete-space',
} as const;

/**
 * Space edit page-specific actions component
 * Uses PageActionContext for modal management and action execution
 */
export function SpaceEditPageActions() {
  const context = usePageActionContext();

  const handleCancel = React.useCallback(async () => {
    await context.executeAction(EDIT_ACTION_IDS.CANCEL);
  }, [context]);

  const handleDeleteSpace = React.useCallback(async () => {
    // Open the delete confirmation modal
    context.openModal(MODAL_IDS.CONFIRM_DELETE);
  }, [context]);

  return (
    <>
      <DropdownMenuItem
        onClick={handleCancel}
        className="cursor-pointer"
        disabled={context.isActionExecuting(EDIT_ACTION_IDS.CANCEL)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        <span>Cancel</span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleDeleteSpace}
        className="cursor-pointer text-destructive"
        disabled={context.isActionExecuting(EDIT_ACTION_IDS.DELETE_SPACE)}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        <span>
          {context.isActionExecuting(EDIT_ACTION_IDS.DELETE_SPACE)
            ? 'Deleting...'
            : 'Delete Space'}
        </span>
      </DropdownMenuItem>
    </>
  );
}
