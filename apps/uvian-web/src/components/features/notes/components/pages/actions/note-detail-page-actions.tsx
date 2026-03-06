'use client';

import * as React from 'react';
import { Trash2 } from 'lucide-react';
import { DropdownMenuItem } from '@org/ui';
import { MODAL_IDS } from '~/components/shared/ui/modals/modal-registry';
import { usePageActionContext } from '~/components/shared/ui/pages/page-actions/page-action-context';
import { useModalContext } from '~/components/shared/ui/modals';

const NOTE_ACTION_IDS = {
  DELETE_NOTE: 'delete-note',
} as const;

/**
 * Note detail page actions component
 * Shows delete option with confirmation modal
 */
export function NoteDetailPageActions() {
  const actionContext = usePageActionContext();
  const modalContext = useModalContext();

  const handleDeleteNote = React.useCallback(() => {
    modalContext.openModal(MODAL_IDS.CONFIRM_DELETE, {
      onConfirmActionId: NOTE_ACTION_IDS.DELETE_NOTE,
    });
  }, [modalContext]);

  return (
    <>
      <DropdownMenuItem
        onClick={handleDeleteNote}
        className="cursor-pointer text-destructive"
        disabled={actionContext.isActionExecuting(NOTE_ACTION_IDS.DELETE_NOTE)}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        <span>
          {actionContext.isActionExecuting(NOTE_ACTION_IDS.DELETE_NOTE)
            ? 'Deleting...'
            : 'Delete Note'}
        </span>
      </DropdownMenuItem>
    </>
  );
}
