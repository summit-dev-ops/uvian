'use client';

import * as React from 'react';
import { Trash2 } from 'lucide-react';
import { DropdownMenuItem } from '@org/ui';
import { MODAL_IDS } from '~/components/shared/ui/modals/modal-registry';
import { usePageActionContext } from '~/components/shared/ui/pages/page-actions/page-action-context';
import { useModalContext } from '~/components/shared/ui/modals';

const POST_ACTION_IDS = {
  DELETE_POST: 'delete-post',
} as const;

export function PostDetailPageActions() {
  const actionContext = usePageActionContext();
  const modalContext = useModalContext();

  const handleDeletePost = React.useCallback(async () => {
    modalContext.openModal(MODAL_IDS.CONFIRM_DELETE, {
      onConfirmActionId: POST_ACTION_IDS.DELETE_POST,
    });
  }, [modalContext]);

  return (
    <>
      <DropdownMenuItem
        onClick={handleDeletePost}
        className="cursor-pointer text-destructive"
        disabled={actionContext.isActionExecuting(POST_ACTION_IDS.DELETE_POST)}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        <span>
          {actionContext.isActionExecuting(POST_ACTION_IDS.DELETE_POST)
            ? 'Deleting...'
            : 'Delete Post'}
        </span>
      </DropdownMenuItem>
    </>
  );
}
