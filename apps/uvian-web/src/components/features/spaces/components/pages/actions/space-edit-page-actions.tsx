'use client';

import * as React from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { DropdownMenuItem } from '@org/ui';
import { usePageActionContext } from '~/components/shared/ui/pages/page-actions/page-action-context';
import { useModalContext, MODAL_IDS } from '~/components/shared/ui/modals';

const EDIT_ACTION_IDS = {
  CANCEL: 'cancel',
  DELETE_SPACE: 'delete-space',
} as const;

/**
 * Space edit page-specific actions component
 * Uses PageActionContext for modal management and action execution
 */
export function SpaceEditPageActions() {
  const actionContext = usePageActionContext();
  const modalContext = useModalContext();

  const handleCancel = React.useCallback(async () => {
    await actionContext.executeAction(EDIT_ACTION_IDS.CANCEL);
  }, [actionContext]);

  const handleDeleteSpace = React.useCallback(async () => {
    modalContext.openModal(MODAL_IDS.CONFIRM_DELETE);
  }, [modalContext]);

  return (
    <>
      <DropdownMenuItem
        onClick={handleCancel}
        className="cursor-pointer"
        disabled={actionContext.isActionExecuting(EDIT_ACTION_IDS.CANCEL)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        <span>Cancel</span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleDeleteSpace}
        className="cursor-pointer text-destructive"
        disabled={actionContext.isActionExecuting(EDIT_ACTION_IDS.DELETE_SPACE)}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        <span>
          {actionContext.isActionExecuting(EDIT_ACTION_IDS.DELETE_SPACE)
            ? 'Deleting...'
            : 'Delete Space'}
        </span>
      </DropdownMenuItem>
    </>
  );
}
